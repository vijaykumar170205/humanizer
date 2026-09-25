import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { config } from './src/config/env.js';

const PORT = config.port || 5000;

const startServer = async () => {
  // Connect to Database
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Humanoider Server running in [${config.env}] mode on http://localhost:${PORT}`);
    console.log(`📡 AI Provider configured: [${config.ai.provider.toUpperCase()}]`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use by another process.`);
    } else {
      console.error('❌ Server startup error:', err.message);
    }
    process.exit(1);
  });

  // Graceful shutdown handlers
  const handleShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('🏁 Humanly HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));

  process.on('unhandledRejection', (err) => {
    console.error('💥 Unhandled Rejection:', err.message);
  });
};

startServer();
