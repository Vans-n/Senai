const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

// inicializa DB (executa migrations iniciais)
require('./db/db');

const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const agendaRouter = require('./routes/agenda');
const uploadsRouter = require('./routes/uploads');

const app = express();
const corsOptions = {
  origin: process.env.CORS_ORIGIN || true,
  credentials: true
};
app.use(cors(corsOptions));
app.options('/api/*', cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// APIs
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/agenda', agendaRouter);
app.use('/api/uploads', uploadsRouter);

// serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.all('/api/*', (req, res) => {
  res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
});

// Serve frontend estático (pasta src/pages)
app.use('/', express.static(path.join(__dirname, 'src', 'pages')));

// Fallback para SPA / rotas não encontradas
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'pages', 'feed', 'feed.html'));
});

// Error handler — padroniza respostas de erro JSON
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err && err.status ? err.status : 500;
  const code = err && err.code ? err.code : 'INTERNAL_ERROR';
  const message = err && err.message ? err.message : 'Internal server error';
  const detail = err && err.detail ? err.detail : undefined;
  const payload = { error: message, code };
  if (detail) payload.detail = detail;
  res.status(status).json(payload);
});

const PORT = parseInt(process.env.PORT, 10) || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
