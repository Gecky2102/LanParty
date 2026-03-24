const express = require('express');
const mysql = require('mysql2');
const app = express();
const path = require('path');
const port = 3000;

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
  host: "mysql",
  user: "root",
  password: "cisco",
  database: "lanparty",
  connectionLimit: 10
});

con.connect((err) => {
  if(err){
    console.log(err)
  }
  console.log("Connected!");
});

//nel caso di errori, controlla che nella header della richiesta ci sia il content-type application/json
app.post('/studente', (req, res) => {
  console.log(req)
  console.log(req.body)
  const username = req.body.username;
  const punteggio = req.body.punteggio;
  const sezione = req.body.sezione;

  var query = "INSERT INTO studenti (username,punteggio,sezione) VALUES (?,?,?)";

  con.query(query, [username,punteggio,sezione], (err, result) => {
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
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

