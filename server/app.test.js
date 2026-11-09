import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from './db.js';
import { createApp } from './app.js';

let server;
let base;

before(async () => {
  const app = createApp(openDb(':memory:'));
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => server.close());

const send = (path, method = 'GET', body) =>
  fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

test('health returns OK', async () => {
  const res = await send('/health');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'OK' });
});

test('create then list shows newest first', async () => {
  const a = await (await send('/checkins', 'POST', { mood: 3, note: 'first' })).json();
  const b = await (await send('/checkins', 'POST', { mood: 5, note: 'second' })).json();
  assert.ok(b.id > a.id);
  const list = await (await send('/checkins')).json();
  assert.equal(list[0].id, b.id);
});

test('update changes mood and keeps note', async () => {
  const row = await (await send('/checkins', 'POST', { mood: 2, note: 'keep me' })).json();
  const res = await send(`/checkins/${row.id}`, 'PUT', { mood: 4 });
  assert.equal(res.status, 200);
  const updated = await res.json();
  assert.equal(updated.mood, 4);
  assert.equal(updated.note, 'keep me');
});

test('delete removes the row, second delete is 404', async () => {
  const row = await (await send('/checkins', 'POST', { mood: 1 })).json();
  assert.equal((await send(`/checkins/${row.id}`, 'DELETE')).status, 204);
  assert.equal((await send(`/checkins/${row.id}`, 'DELETE')).status, 404);
});

test('bad input returns 400', async () => {
  assert.equal((await send('/checkins', 'POST', { mood: 9 })).status, 400);
  assert.equal((await send('/checkins', 'POST', { mood: 4.5 })).status, 400);
  assert.equal((await send('/checkins', 'POST', { mood: 3, note: 'x'.repeat(501) })).status, 400);
});

test('update of a missing id returns 404', async () => {
  assert.equal((await send('/checkins/99999', 'PUT', { mood: 2 })).status, 404);
});
