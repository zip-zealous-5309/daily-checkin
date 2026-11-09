import express from 'express';

function check(body, partial) {
  const out = {};
  if (!partial || body.mood !== undefined) {
    if (!Number.isInteger(body.mood) || body.mood < 1 || body.mood > 5) {
      return { error: 'mood must be a whole number from 1 to 5' };
    }
    out.mood = body.mood;
  }
  if (body.note !== undefined) {
    if (typeof body.note !== 'string' || body.note.length > 500) {
      return { error: 'note must be text of 500 characters or fewer' };
    }
    out.note = body.note.trim();
  }
  return { value: out };
}

export function createApp(db) {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

  app.get('/api/checkins', (req, res) => {
    res.json(db.prepare('SELECT * FROM checkins ORDER BY id DESC').all());
  });

  app.post('/api/checkins', (req, res) => {
    const { error, value } = check(req.body ?? {}, false);
    if (error) return res.status(400).json({ error });
    const info = db.prepare('INSERT INTO checkins (mood, note) VALUES (?, ?)').run(value.mood, value.note ?? '');
    res.status(201).json(db.prepare('SELECT * FROM checkins WHERE id = ?').get(info.lastInsertRowid));
  });

  app.put('/api/checkins/:id', (req, res) => {
    const id = Number(req.params.id);
    const row = db.prepare('SELECT * FROM checkins WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ error: 'not found' });
    const { error, value } = check(req.body ?? {}, true);
    if (error) return res.status(400).json({ error });
    const next = { mood: row.mood, note: row.note, ...value };
    db.prepare('UPDATE checkins SET mood = ?, note = ? WHERE id = ?').run(next.mood, next.note, id);
    res.json(db.prepare('SELECT * FROM checkins WHERE id = ?').get(id));
  });

  app.delete('/api/checkins/:id', (req, res) => {
    const info = db.prepare('DELETE FROM checkins WHERE id = ?').run(Number(req.params.id));
    if (info.changes === 0) return res.status(404).json({ error: 'not found' });
    res.status(204).end();
  });

  return app;
}
