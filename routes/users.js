const express = require('express');
const router = express.Router();
const db = require('../db/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/auth');

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
    profileCompleted: row.profile_completed === 1,
    created_at: row.created_at
  };
}

function buildJsonString(value) {
  if (value === undefined || value === null) return JSON.stringify([]);
  return JSON.stringify(Array.isArray(value) ? value : [value]);
}

// Allows CORS preflight for this route
router.options('/', (req, res) => res.sendStatus(204));

// Lista usuários — rota protegida
router.get('/', authenticate, (req, res, next) => {
  db.all('SELECT id, name, email, created_at FROM users', [], (err, rows) => {
    if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
    res.json(rows);
  });
});

router.get('/me', authenticate, (req, res, next) => {
  db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, row) => {
    if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
    if (!row) return next({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' });
    res.json(mapUserRow(row));
  });
});

router.patch('/me', authenticate, (req, res, next) => {
  const { title, about, teachSkills, learnSkills, availability, photo, profileCompleted } = req.body;

  db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, row) => {
    if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
    if (!row) return next({ status: 404, code: 'USER_NOT_FOUND', message: 'User not found' });

    const updatedUser = {
      title: title !== undefined ? title : row.title,
      about: about !== undefined ? about : row.about,
      teachSkills: teachSkills !== undefined ? teachSkills : row.teach_skills,
      learnSkills: learnSkills !== undefined ? learnSkills : row.learn_skills,
      availability: availability !== undefined ? availability : (row.availability ? JSON.parse(row.availability) : []),
      photo: photo !== undefined ? photo : row.photo,
      profileCompleted: profileCompleted !== undefined ? profileCompleted : (row.profile_completed === 1)
    };

    db.run(
      'UPDATE users SET title = ?, about = ?, teach_skills = ?, learn_skills = ?, availability = ?, photo = ?, profile_completed = ? WHERE id = ?',
      [
        updatedUser.title || '',
        updatedUser.about || '',
        updatedUser.teachSkills || '',
        updatedUser.learnSkills || '',
        JSON.stringify(Array.isArray(updatedUser.availability) ? updatedUser.availability : []),
        updatedUser.photo || '',
        updatedUser.profileCompleted ? 1 : 0,
        req.user.id
      ],
      function (err) {
        if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });

        db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, row) => {
          if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
          res.json(mapUserRow(row));
        });
      }
    );
  });
});

// Register a new user and return a JWT
router.post('/', async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return next({ status: 400, code: 'INVALID_PAYLOAD', message: 'Name, email and password required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (name, email, password) VALUES (?,?,?)', [name, email, hash], function (err) {
      if (err) {
        if (err.message && err.message.includes('UNIQUE constraint failed: users.email')) {
          return next({ status: 409, code: 'EMAIL_TAKEN', message: 'Email is already registered' });
        }
        return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
      }

      const user = {
        id: this.lastID,
        name,
        email,
        title: '',
        about: '',
        teachSkills: '',
        learnSkills: '',
        availability: [],
        photo: '',
        profileCompleted: false
      };
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({ token, user });
    });
  } catch (e) {
    next({ status: 500, code: 'INTERNAL_ERROR', message: e.message });
  }
});

module.exports = router;
