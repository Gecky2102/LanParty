function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Endpoint non trovato' });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  console.error(error);
  res.status(error.statusCode || 500).json({
    message: error.publicMessage || 'Errore interno del server'
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
