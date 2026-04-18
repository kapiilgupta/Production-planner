const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';

  console.error(`[${new Date().toISOString()}] ERROR: ${err.name} – ${err.message}`);
  if (isDev) console.error(err.stack);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error:   messages.join(' | '),
      ...(isDev && { stack: err.stack }),
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error:   `Invalid value for field "${err.path}": expected ${err.kind}, got "${err.value}"`,
      ...(isDev && { stack: err.stack }),
    });
  }

  if (err.code === 11000) {
    const field   = Object.keys(err.keyValue || {})[0] || 'field';
    const value   = err.keyValue?.[field];
    return res.status(400).json({
      success: false,
      error:   `Duplicate value "${value}" for field "${field}". Please use a unique value.`,
      ...(isDev && { stack: err.stack }),
    });
  }

  const statusCode = err.statusCode || err.status || 500;

  return res.status(statusCode).json({
    success: false,
    error:   isDev
      ? err.message
      : statusCode >= 500
        ? 'An internal server error occurred. Please try again later.'
        : err.message,
    ...(isDev && { stack: err.stack }),
  });
};

export default errorHandler;