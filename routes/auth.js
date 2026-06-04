const express = require('express');
const router = express.Router();
const db = require('../db/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

function mapUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    title: row.title || '',
    about: row.about || '',
    teachSkills: row.teach_skills || '',
    learnSkills: row.learn_skills || '',
    availability: row.availability ? JSON.parse(row.availability) : [],
    photo: row.photo || '',
    profileCompleted: row.profile_completed === 1
  };
}

router.options('/login', (req, res) => res.sendStatus(204));

router.post('/login', (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return next({ status: 400, code: 'INVALID_PAYLOAD', message: 'Email and password required' });

  db.get('SELECT * FROM users WHERE email=?', [email], async (err, row) => {
    if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
    if (!row) return next({ status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, row.password);
    if (!match) return next({ status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });

    const token = jwt.sign({ id: row.id, email: row.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: mapUserRow(row) });
  });
});

module.exports = router;
