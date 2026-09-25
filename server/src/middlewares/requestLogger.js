/**
 * Request Tracing and Structured Logger Middleware
 * Logs method, route, status code, response time without recording private passwords or sensitive payload contents.
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 9);
  req.requestId = requestId;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusEmoji = statusCode >= 500 ? '🔥' : statusCode >= 400 ? '⚠️' : '✨';
    
    // Do not log healthchecks or static assets in noisy manner
    if (req.originalUrl.includes('/health')) return;

    console.log(
      `${statusEmoji} [${new Date().toISOString()}] [Req: ${requestId}] ${req.method} ${req.originalUrl} - ${statusCode} (${duration}ms)`
    );
  });

  next();
};
