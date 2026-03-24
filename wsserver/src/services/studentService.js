const pool = require('../db/pool');

function validateNumber(value) {
  return Number.isFinite(Number(value));
}

function normalizeSectionName(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
}

async function createStudent({ username, sezione, punteggio }) {
  const normalizedName = String(username || '').trim();
  const normalizedSection = normalizeSectionName(sezione);
  const normalizedScore = Number(punteggio);

  if (!normalizedName || !normalizedSection || !validateNumber(normalizedScore)) {
    const error = new Error('Parametri non validi: username, sezione, punteggio');
    error.statusCode = 400;
    error.publicMessage = error.message;
    throw error;
  }

  const [result] = await pool.execute(
    'INSERT INTO studenti (username, punteggio, sezione) VALUES (?, ?, ?)',
    [normalizedName, normalizedScore, normalizedSection]
  );

  return {
    id: result.insertId,
    username: normalizedName,
    sezione: normalizedSection,
    punteggio: normalizedScore
  };
}

async function listStudents() {
  const [rows] = await pool.execute(
    'SELECT id, username, punteggio, sezione FROM studenti ORDER BY id ASC'
  );
  return rows;
}

async function getRankingByClass() {
  const [rows] = await pool.execute(
    'SELECT s.sezione, SUM(s.punteggio) AS punteggio FROM studenti s GROUP BY s.sezione ORDER BY SUM(s.punteggio) DESC'
  );
  return rows;
}

async function getRankingByPlayer() {
  const [rows] = await pool.execute(
    'SELECT s.username, SUM(s.punteggio) AS punteggio FROM studenti s GROUP BY s.username ORDER BY SUM(s.punteggio) DESC'
  );
  return rows;
}

async function getCombinedRankings() {
  const [teams, players] = await Promise.all([
    getRankingByClass(),
    getRankingByPlayer()
  ]);

  return {
    teams,
    players,
    generatedAt: new Date().toISOString()
  };
}

async function resetStudents() {
  await pool.execute('TRUNCATE TABLE studenti');
}

async function setStudentScore({ id, punteggio }) {
  const numericId = Number(id);
  const numericScore = Number(punteggio);

  if (!Number.isInteger(numericId) || !validateNumber(numericScore)) {
    const error = new Error('Parametri non validi: id, punteggio');
    error.statusCode = 400;
    error.publicMessage = error.message;
    throw error;
  }

  const [result] = await pool.execute(
    'UPDATE studenti SET punteggio = ? WHERE id = ?',
    [numericScore, numericId]
  );

  if (result.affectedRows === 0) {
    const error = new Error('Studente non trovato');
    error.statusCode = 404;
    error.publicMessage = error.message;
    throw error;
  }
}

async function addStudentScore({ id, delta }) {
  const numericId = Number(id);
  const numericDelta = Number(delta);

  if (!Number.isInteger(numericId) || !validateNumber(numericDelta)) {
    const error = new Error('Parametri non validi: id, delta');
    error.statusCode = 400;
    error.publicMessage = error.message;
    throw error;
  }

  const [result] = await pool.execute(
    'UPDATE studenti SET punteggio = punteggio + ? WHERE id = ?',
    [numericDelta, numericId]
  );

  if (result.affectedRows === 0) {
    const error = new Error('Studente non trovato');
    error.statusCode = 404;
    error.publicMessage = error.message;
    throw error;
  }
}

async function deleteStudent({ id }) {
  const numericId = Number(id);

  if (!Number.isInteger(numericId)) {
    const error = new Error('Parametro non valido: id');
    error.statusCode = 400;
    error.publicMessage = error.message;
    throw error;
  }

  const [result] = await pool.execute('DELETE FROM studenti WHERE id = ?', [numericId]);

  if (result.affectedRows === 0) {
    const error = new Error('Studente non trovato');
    error.statusCode = 404;
    error.publicMessage = error.message;
    throw error;
  }
}

async function updateStudent({ id, username, sezione, punteggio }) {
  const numericId = Number(id);
  const normalizedName = String(username || '').trim();
  const normalizedSection = normalizeSectionName(sezione);
  const numericScore = Number(punteggio);

  if (!Number.isInteger(numericId) || !normalizedName || !normalizedSection || !validateNumber(numericScore)) {
    const error = new Error('Parametri non validi: id, username, sezione, punteggio');
    error.statusCode = 400;
    error.publicMessage = error.message;
    throw error;
  }

  const [result] = await pool.execute(
    'UPDATE studenti SET username = ?, sezione = ?, punteggio = ? WHERE id = ?',
    [normalizedName, normalizedSection, numericScore, numericId]
  );

  if (result.affectedRows === 0) {
    const error = new Error('Studente non trovato');
    error.statusCode = 404;
    error.publicMessage = error.message;
    throw error;
  }
}

module.exports = {
  createStudent,
  listStudents,
  getRankingByClass,
  getRankingByPlayer,
  getCombinedRankings,
  resetStudents,
  setStudentScore,
  addStudentScore,
  deleteStudent,
  updateStudent
};
