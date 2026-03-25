export function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Endpoint non trovato' });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON non valido nella richiesta' });
  }

  console.error(error);
  res.status(error.statusCode || 500).json({
    message: error.publicMessage || 'Errore interno del server'
  });
}
