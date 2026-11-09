import { openDb } from './db.js';
import { createApp } from './app.js';

const port = process.env.PORT || 4000;
createApp(openDb('checkins.db')).listen(port, () => console.log('API on ' + port));
