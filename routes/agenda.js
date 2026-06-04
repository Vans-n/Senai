const express = require('express');
const router = express.Router();
const db = require('../db/db');
const authenticate = require('../middleware/auth');

// Lista agenda — rota protegida
// Lista agenda — rota protegida
router.get('/', authenticate, (req, res, next) => {
  db.all(
    'SELECT a.*, u.name as user_name FROM agenda a LEFT JOIN users u ON u.id=a.user_id ORDER BY date',
    [],
    (err, rows) => {
      if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
      res.json(rows);
    }
  );
});

router.post('/', authenticate, (req, res) => {
  const { title, description, date } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Title and date required' });

  const user_id = req.user && req.user.id ? req.user.id : null;

  db.run(
    'INSERT INTO agenda (user_id, title, description, date) VALUES (?,?,?,?)',
    [user_id, title, description || '', date],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

module.exports = router;
