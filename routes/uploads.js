const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

console.log('uploads router loaded');

// Allow CORS preflight
router.options('/', (req, res) => res.sendStatus(204));

// POST /api/uploads - accept JSON { data: "data:image/jpeg;base64,...", filename?: "name.jpg" }
router.post('/', async (req, res, next) => {
  console.log('uploads POST received');
  try {
    const { data, filename } = req.body;
    if (!data || typeof data !== 'string' || !data.startsWith('data:')) {
      return next({ status: 400, code: 'INVALID_PAYLOAD', message: 'Missing data URL' });
    }

    // parse data URL
    const matches = data.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/);
    if (!matches) return next({ status: 400, code: 'INVALID_IMAGE', message: 'Unsupported image format' });
    const mime = matches[1];
    const ext = matches[2] === 'jpeg' ? 'jpg' : matches[2];
    const b64 = matches[3];
    const buffer = Buffer.from(b64, 'base64');

    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const name = filename && filename.replace(/[^a-zA-Z0-9._-]/g, '_') || `img_${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, name);
    fs.writeFileSync(filePath, buffer);

    // return public URL
    const url = `/uploads/${name}`;
    res.json({ url });
  } catch (err) {
    next({ status: 500, code: 'UPLOAD_ERROR', message: 'Failed to save image', detail: err.message });
  }
});

module.exports = router;
