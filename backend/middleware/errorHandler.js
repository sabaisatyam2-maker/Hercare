const notFound = (req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large' });
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message)[0];
    return res.status(400).json({ message });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id or value' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate value already exists' });
  }

  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

module.exports = {
  notFound,
  errorHandler
};
