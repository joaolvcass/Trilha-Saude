'use strict';

async function notification(db, userId, title, detail) {
  await db.execute('INSERT INTO notifications (user_id, title, detail) VALUES (?, ?, ?)', [userId, title, detail]);
}

module.exports = { notification };
