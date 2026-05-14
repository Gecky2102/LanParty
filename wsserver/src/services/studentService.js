import pool from '../db/pool.js';

function validateNumber(value) {
  return Number.isFinite(Number(value));
}

// valida stringhe con spazi, ma rimuove spazi iniziali/finali e limita lunghezza
function validateStringField(value, fieldName, minLength = 1, maxLength = 64) {
  const str = String(value || '').trim();

  // lunghezza
  if (str.length < minLength) {
    const error = new Error(
      `${fieldName} deve avere almeno ${minLength} caratteri`
    );
    error.statusCode = 400;
    error.publicMessage = error.message;
    throw error;
  }


  // sempre lunghezza
  if (str.length > maxLength) {
    const error = new Error(
      `${fieldName} non può superare ${maxLength} caratteri (hai: ${str.length})`
    );
    error.statusCode = 400;
    error.publicMessage = error.message;
    throw error;
  }

  return str;
}

function normalizeSectionName(rawValue) {
  return validateStringField(rawValue, 'Sezione', 1, 10);
}

export async function createStudent({ username, sezione, punteggio }) {
  const normalizedName = validateStringField(username, 'Username', 1, 64);
  const normalizedSection = normalizeSectionName(sezione);
  const normalizedScore = Number(punteggio);

  if (!validateNumber(normalizedScore)) {
    const error = new Error('Punteggio deve essere un numero valido');
    error.statusCode = 400;
    error.publicMessage = error.message;
    throw error;
  }

  const [result] = await pool.execute(
    'INSERT INTO studenti (username, punteggio, sezione) VALUES (?, ?, ?)',
    [normalizedName, normalizedScore, normalizedSection]
  );

  invalidateCache();

  return {
    id: result.insertId,
    username: normalizedName,
    sezione: normalizedSection,
    punteggio: normalizedScore
  };
}

export async function listStudents() {
  const [rows] = await pool.execute(
    'SELECT id, username, punteggio, sezione FROM studenti ORDER BY id ASC'
  );
  return rows;
}

export async function getRankingByClass() {
  const [rows] = await pool.execute(
    'SELECT s.sezione, SUM(s.punteggio) AS punteggio FROM studenti s GROUP BY s.sezione ORDER BY SUM(s.punteggio) DESC'
  );
  return rows;
}

export async function getRankingByPlayer() {
  const [rows] = await pool.execute(
    'SELECT s.username, SUM(s.punteggio) AS punteggio FROM studenti s GROUP BY s.username ORDER BY SUM(s.punteggio) DESC'
  );
  return rows;
}

export async function getCombinedRankings() {
  if (isCacheValid()) {
    console.log('[Cache] Classifiche da cache');
    return rankingCache.data;
  }

  console.log('[DB Query] Classifiche da database');
  const [teams, players] = await Promise.all([
    getRankingByClass(),
    getRankingByPlayer()
  ]);

  rankingCache.data = {
    teams,
    players,
    generatedAt: new Date().toISOString()
  };
  rankingCache.timestamp = Date.now();

  return rankingCache.data;
}

export async function resetStudents() {
  await pool.execute('TRUNCATE TABLE studenti');
  invalidateCache();
}

export async function setStudentScore({ id, punteggio }) {
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

export async function addStudentScore({ id, delta }) {
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

export async function deleteStudent({ id }) {
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

  invalidateCache();
}

export async function updateStudent({ id, username, sezione, punteggio }) {
  const numericId = Number(id);
  
  if (!Number.isInteger(numericId)) {
    const error = new Error('ID deve essere un numero intero valido');
    error.statusCode = 400;
    error.publicMessage = error.message;
    throw error;
  }

  const normalizedName = validateStringField(username, 'Username', 1, 64);
  const normalizedSection = normalizeSectionName(sezione);
  const numericScore = Number(punteggio);

  if (!validateNumber(numericScore)) {
    const error = new Error('Punteggio deve essere un numero valido');
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

  invalidateCache();
}



let rankingCache = {
  data: null,
  timestamp: 0,
  EXPIRY_MS: 60000 // 60 secondi
};


// funzione helper per validare cache
function isCacheValid() {
  return rankingCache.data && 
    (Date.now() - rankingCache.timestamp < rankingCache.EXPIRY_MS);
}

// funzione per invalidare cache (quando dati cambiano)
function invalidateCache() {
  rankingCache.data = null;
  rankingCache.timestamp = 0;
  console.log('[Cache] Classifiche invalidate');
} 