const express = require('express');
const mysql = require('mysql2');
const app = express();
const path = require('path');
const port = 3000;

const dbConfig = {
  host: process.env.MYSQL_HOST || 'mysql',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_ROOT_PASSWORD || 'cisco',
  database: process.env.MYSQL_DATABASE || 'lanparty',
  connectionLimit: 10
};

const adminUser = process.env.ADMIN_USER || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

// Allow cross-origin requests from static sites consuming this API.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

app.use(express.static(path.join(__dirname, 'sito')));

app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

var con = mysql.createConnection({
  ...dbConfig
});

con.connect((err) => {
  if(err){
    console.log(err);
    return;
  }
  console.log("Connected!");
});

function parseBasicAuth(authHeader) {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return null;
  }

  try {
    const base64Part = authHeader.slice(6).trim();
    const decoded = Buffer.from(base64Part, 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');

    if (separatorIndex < 0) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1)
    };
  } catch (error) {
    return null;
  }
}

function requireAdmin(req, res, next) {
  const credentials = parseBasicAuth(req.headers.authorization);

  if (!credentials || credentials.username !== adminUser || credentials.password !== adminPassword) {
    res.setHeader('WWW-Authenticate', 'Basic realm="LanParty Admin"');
    return res.status(401).send({ message: 'Credenziali admin non valide' });
  }

  next();
}

function isValidNumber(value) {
  return Number.isFinite(Number(value));
}

//nel caso di errori, controlla che nella header della richiesta ci sia il content-type application/json
app.post('/studente', (req, res) => {
  const username = req.body.username;
  const punteggio = req.body.punteggio;
  const sezione = req.body.sezione;

  if (!username || !sezione || !isValidNumber(punteggio)) {
    res.status(400).send({ message: 'Parametri non validi: username, sezione, punteggio' });
    return;
  }

  var query = "INSERT INTO studenti (username,punteggio,sezione) VALUES (?,?,?)";

  con.query(query, [username, Number(punteggio), sezione], (err, result) => {
    if(err){
      console.log(`errore nell'inserimento dello studente ${err.message}`);
      res.status(500).send({message:`Errore interno del server`});
      return;
    }
    console.log(`studente inserito con successo`);
    res.status(201).send({message:`studente ${username} aggiunta`});
  });
});

app.get('/classeVincitrice', (req,res) => {
  var query = "SELECT s.sezione,sum(s.punteggio) as punteggio FROM studenti s group by s.sezione order by sum(s.punteggio) desc";

  con.query(query, [], (err, result) => {
    if(err){
      console.log(`errore nel calcolo della classifica ${err.message}`);
      res.status(500).send({message:`Errore interno del server`});
      return;
    }
    console.log(`classifica calcolata: ${result}`);
    res.status(200).send(result);
  });
});

app.get('/admin', requireAdmin, (req, res) => {
  res.status(200).send({
    message: 'Area admin disponibile',
    actions: ['reset', 'backup', 'setScore', 'addScore', 'deleteStudent'],
    usage: {
      endpoint: '/admin',
      method: 'POST',
      bodyExamples: [
        { action: 'reset' },
        { action: 'backup' },
        { action: 'setScore', id: 1, punteggio: 25 },
        { action: 'addScore', id: 1, delta: 5 },
        { action: 'deleteStudent', id: 1 }
      ]
    }
  });
});

app.get('/admin/studenti', requireAdmin, (req, res) => {
  const query = 'SELECT id, username, punteggio, sezione FROM studenti ORDER BY id ASC';

  con.query(query, [], (err, result) => {
    if (err) {
      console.log(`errore lettura studenti ${err.message}`);
      res.status(500).send({ message: 'Errore interno del server' });
      return;
    }

    res.status(200).send(result);
  });
});

app.post('/admin', requireAdmin, (req, res) => {
  const action = req.body.action;

  if (!action) {
    res.status(400).send({ message: 'Campo action obbligatorio' });
    return;
  }

  if (action === 'reset') {
    con.query('TRUNCATE TABLE studenti', [], (err) => {
      if (err) {
        console.log(`errore reset database ${err.message}`);
        res.status(500).send({ message: 'Errore interno del server' });
        return;
      }

      res.status(200).send({ message: 'Database resettato: tabella studenti svuotata' });
    });
    return;
  }

  if (action === 'backup') {
    const query = 'SELECT id, username, punteggio, sezione FROM studenti ORDER BY id ASC';
    con.query(query, [], (err, result) => {
      if (err) {
        console.log(`errore backup database ${err.message}`);
        res.status(500).send({ message: 'Errore interno del server' });
        return;
      }

      const payload = {
        generatedAt: new Date().toISOString(),
        totalRecords: result.length,
        students: result
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="lanparty-backup-${Date.now()}.json"`);
      res.status(200).send(JSON.stringify(payload, null, 2));
    });
    return;
  }

  if (action === 'setScore') {
    const id = Number(req.body.id);
    const punteggio = Number(req.body.punteggio);

    if (!Number.isInteger(id) || !Number.isFinite(punteggio)) {
      res.status(400).send({ message: 'Parametri non validi: id, punteggio' });
      return;
    }

    con.query('UPDATE studenti SET punteggio = ? WHERE id = ?', [punteggio, id], (err, result) => {
      if (err) {
        console.log(`errore setScore ${err.message}`);
        res.status(500).send({ message: 'Errore interno del server' });
        return;
      }

      if (result.affectedRows === 0) {
        res.status(404).send({ message: 'Studente non trovato' });
        return;
      }

      res.status(200).send({ message: 'Punteggio aggiornato con successo' });
    });
    return;
  }

  if (action === 'addScore') {
    const id = Number(req.body.id);
    const delta = Number(req.body.delta);

    if (!Number.isInteger(id) || !Number.isFinite(delta)) {
      res.status(400).send({ message: 'Parametri non validi: id, delta' });
      return;
    }

    con.query('UPDATE studenti SET punteggio = punteggio + ? WHERE id = ?', [delta, id], (err, result) => {
      if (err) {
        console.log(`errore addScore ${err.message}`);
        res.status(500).send({ message: 'Errore interno del server' });
        return;
      }

      if (result.affectedRows === 0) {
        res.status(404).send({ message: 'Studente non trovato' });
        return;
      }

      res.status(200).send({ message: 'Incremento punteggio applicato' });
    });
    return;
  }

  if (action === 'deleteStudent') {
    const id = Number(req.body.id);
    if (!Number.isInteger(id)) {
      res.status(400).send({ message: 'Parametro non valido: id' });
      return;
    }

    con.query('DELETE FROM studenti WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.log(`errore deleteStudent ${err.message}`);
        res.status(500).send({ message: 'Errore interno del server' });
        return;
      }

      if (result.affectedRows === 0) {
        res.status(404).send({ message: 'Studente non trovato' });
        return;
      }

      res.status(200).send({ message: 'Studente eliminato con successo' });
    });
    return;
  }

  res.status(400).send({ message: 'Azione non supportata' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

