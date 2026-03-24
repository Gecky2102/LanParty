# LanParty

Progetto Node.js + MySQL per gestione punteggi LAN party con:

- classifica pubblica live
- dashboard admin web protetta
- operazioni database (backup/reset)
- gestione completa studenti e punteggi

## Stack

- Node.js 20
- Express
- MySQL 9
- Docker Compose

## Struttura

- `wsserver/src`: backend modulare (config, db, middleware, routes, services)
- `wsserver/sito`: frontend pubblico + dashboard admin
- `mysql/init.sql`: schema iniziale
- `docker-compose.yaml`: orchestrazione servizi

## Configurazione

Crea un file `.env` nella root progetto (puoi partire da `.env.example`):

```env
MYSQL_ROOT_PASSWORD=cisco
MYSQL_DATABASE=lanparty
ADMIN_USER=admin
ADMIN_PASSWORD=@dmin!
```

## Avvio con Docker

```bash
docker compose up --build
```

App disponibile su:

- classifica pubblica: `http://localhost:3000`
- dashboard admin: `http://localhost:3000/admin/dashboard`

## Endpoint API

Pubblici:

- `POST /studente` aggiunge uno studente
- `GET /classeVincitrice` restituisce classifica per sezione

Admin (Basic Auth):

- `GET /admin` info area admin
- `GET /admin/studenti` elenco studenti
- `POST /admin` azioni:
	- `reset`
	- `backup`
	- `createStudent`
	- `setScore`
	- `addScore`
	- `updateStudent`
	- `deleteStudent`

## Dashboard Admin

La dashboard consente:

- login admin
- visualizzazione studenti
- inserimento studente
- modifica punteggio/sezione
- incremento/decremento punteggio
- eliminazione studente
- download backup JSON
- reset totale tabella studenti

## Sviluppo locale (solo wsserver)

```bash
cd wsserver
npm install
npm run dev
```

## Note

- Le credenziali admin sono lette da variabili ambiente.
- Le API restano compatibili con il flusso usato finora.