const express = require('express');
const router = express.Router();
const db = require('../db/db');
const authenticate = require('../middleware/auth');

function mapSkillRow(row) {
  if (!row) return null;
  return { id: row.id, name: row.name, created_at: row.created_at };
}

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
    photo: row.photo || ''
  };
}

// Create a skill
router.post('/', authenticate, (req, res, next) => {
  const { name } = req.body;
  if (!name) return next({ status: 400, code: 'INVALID_PAYLOAD', message: 'Skill name required' });
  const n = name.trim();
  db.run('INSERT INTO skills (name) VALUES (?)', [n], function (err) {
    if (err) {
      if (err.message && err.message.includes('UNIQUE')) return next({ status: 409, code: 'SKILL_EXISTS', message: 'Skill already exists' });
      return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
    }
    db.get('SELECT * FROM skills WHERE id = ?', [this.lastID], (err, row) => {
      if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
      res.status(201).json(mapSkillRow(row));
    });
  });
});

// List skills
router.get('/', (req, res, next) => {
  db.all('SELECT * FROM skills ORDER BY name COLLATE NOCASE', [], (err, rows) => {
    if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
    res.json(rows.map(mapSkillRow));
  });
});

// Update skill
router.put('/:id', authenticate, (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  const { name } = req.body;
  if (!name) return next({ status: 400, code: 'INVALID_PAYLOAD', message: 'Skill name required' });
  db.run('UPDATE skills SET name = ? WHERE id = ?', [name.trim(), id], function (err) {
    if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
    db.get('SELECT * FROM skills WHERE id = ?', [id], (err, row) => {
      if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
      if (!row) return next({ status: 404, code: 'NOT_FOUND', message: 'Skill not found' });
      res.json(mapSkillRow(row));
    });
  });
});

// Delete skill
router.delete('/:id', authenticate, (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  db.run('DELETE FROM skills WHERE id = ?', [id], function (err) {
    if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
    res.json({ success: true });
  });
});

// Assign skill to current user (type: 'teach'|'learn')
router.post('/me/skills', authenticate, (req, res, next) => {
  const userId = req.user.id;
  const { skillId, skillName, type } = req.body;
  if (!type || !['teach', 'learn'].includes(type)) return next({ status: 400, code: 'INVALID_PAYLOAD', message: 'type must be "teach" or "learn"' });

  function insertLink(sid) {
    db.run('INSERT OR IGNORE INTO user_skills (user_id, skill_id, type) VALUES (?,?,?)', [userId, sid, type], function (err) {
      if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
      db.get('SELECT * FROM skills WHERE id = ?', [sid], (err, row) => {
        if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
        res.status(201).json({ skill: mapSkillRow(row), type });
      });
    });
  }

  if (skillId) return insertLink(skillId);
  if (skillName) {
    const name = skillName.trim();
    db.get('SELECT * FROM skills WHERE name = ?', [name], (err, row) => {
      if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
      if (row) return insertLink(row.id);
      db.run('INSERT INTO skills (name) VALUES (?)', [name], function (err) {
        if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
        insertLink(this.lastID);
      });
    });
    return;
  }

  return next({ status: 400, code: 'INVALID_PAYLOAD', message: 'skillId or skillName required' });
});

// Remove skill link from current user
router.delete('/me/skills', authenticate, (req, res, next) => {
  const userId = req.user.id;
  const { skillId, type } = req.body;
  if (!skillId || !type) return next({ status: 400, code: 'INVALID_PAYLOAD', message: 'skillId and type required' });
  db.run('DELETE FROM user_skills WHERE user_id = ? AND skill_id = ? AND type = ?', [userId, skillId, type], function (err) {
    if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
    res.json({ success: true });
  });
});

// Recommendations endpoint: find users who teach skills the current user wants to learn
router.get('/recommendations', authenticate, async (req, res, next) => {
  const userId = req.user.id;

  // First try: get normalized learn skills for user
  db.all('SELECT s.name FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = ? AND us.type = ?', [userId, 'learn'], (err, rows) => {
    if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
    const learnSkills = (rows || []).map(r => r.name).filter(Boolean);

    if (learnSkills.length > 0) {
      // Use normalized table to find matching users who teach those skills
      const placeholders = learnSkills.map(() => '?').join(',');
      const params = [...learnSkills, userId];
      const sql = `SELECT u.id, u.name, u.email, GROUP_CONCAT(s.name) as matched_skills, COUNT(*) as score
                   FROM user_skills us
                   JOIN skills s ON us.skill_id = s.id
                   JOIN users u ON us.user_id = u.id
                   WHERE us.type = 'teach' AND s.name IN (${placeholders}) AND u.id != ?
                   GROUP BY u.id
                   ORDER BY score DESC LIMIT 50`;

      db.all(sql, params, (err, rows) => {
        if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
        const results = (rows || []).map(r => ({ user: mapUserRow(r), matchedSkills: r.matched_skills ? r.matched_skills.split(',') : [], score: r.score }));
        return res.json({ recommendations: results });
      });
      return;
    }

    // Fallback: use users.teach_skills / users.learn_skills text fields
    db.get('SELECT learn_skills FROM users WHERE id = ?', [userId], (err, userRow) => {
      if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
      const rawLearn = (userRow && userRow.learn_skills) ? userRow.learn_skills : '';
      const desired = rawLearn.split(',').map(s => s.trim()).filter(Boolean);

      if (desired.length === 0) return res.json({ recommendations: [] });

      db.all('SELECT id, name, email, teach_skills FROM users WHERE id != ?', [userId], (err, rows) => {
        if (err) return next({ status: 500, code: 'DB_ERROR', message: 'Database error', detail: err.message });
        const recs = [];
        (rows || []).forEach(r => {
          const teaches = (r.teach_skills || '').split(',').map(s => s.trim()).filter(Boolean);
          const matched = teaches.filter(t => desired.some(d => d.toLowerCase() === t.toLowerCase()));
          if (matched.length > 0) {
            recs.push({ user: mapUserRow(r), matchedSkills: matched, score: matched.length });
          }
        });
        recs.sort((a, b) => b.score - a.score);
        return res.json({ recommendations: recs });
      });
    });
  });
});

module.exports = router;
