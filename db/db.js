const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const initSqlPath = path.join(__dirname, 'init.sql');
const initSql = fs.existsSync(initSqlPath) ? fs.readFileSync(initSqlPath, 'utf8') : '';

const isTest = process.env.NODE_ENV === 'test';
const dbPath = isTest ? ':memory:' : path.join(__dirname, '..', 'data', 'app.db');
if (!isTest) fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao abrir o banco:', err.message);
  } else {
    console.log('Conectado ao SQLite:', dbPath);
  }
});

if (initSql) {
  db.serialize(() => {
    db.exec(initSql, (err) => {
      if (err) console.error('Erro ao inicializar DB:', err.message);
      else console.log('Banco inicializado (migrations aplicadas).');
    });

    const requiredColumns = [
      { name: 'title', definition: 'TEXT' },
      { name: 'about', definition: 'TEXT' },
      { name: 'teach_skills', definition: 'TEXT' },
      { name: 'learn_skills', definition: 'TEXT' },
      { name: 'availability', definition: 'TEXT' },
      { name: 'photo', definition: 'TEXT' },
      { name: 'profile_completed', definition: 'INTEGER DEFAULT 0' }
    ];

    db.all("PRAGMA table_info(users)", (err, rows) => {
      if (err) {
        console.error('Erro ao verificar colunas da tabela users:', err.message);
        return;
      }

      const existingColumns = rows.map(row => row.name);
      requiredColumns.forEach(column => {
        if (!existingColumns.includes(column.name)) {
          db.run(
            `ALTER TABLE users ADD COLUMN ${column.name} ${column.definition}`,
            (err) => {
              if (err) console.error(`Erro ao adicionar coluna ${column.name}:`, err.message);
              else console.log(`Coluna ${column.name} adicionada à tabela users.`);
            }
          );
        }
      });
    });
  });
}

module.exports = db;
