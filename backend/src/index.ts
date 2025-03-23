/**
 * Application Entry Point
 * Starts the server and handles connections
 */

// Load environment variables first
import * as dotenv from 'dotenv';
dotenv.config();

// Core dependencies
import http from 'http';

// Configuration
import { logger } from './config/logger';
import { connectDB, disconnectDB } from './config/db';
import { SERVER_CONFIG, ROUTES_CONFIG } from './config/app';

// Application
import { createApp } from './server';

/**
 * Normalizes port value to handle various input formats
 */
function normalizePort(val: string): number | string | boolean {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    return val; // pipe
  }
  if (port >= 0) {
    return port;
  }
  return false;
}

/**
 * Starts the server and connects to the database
 */
async function startServer(): Promise<void> {
  try {
    logger.info(`Environment: ${SERVER_CONFIG.env}`);
    logger.info(`Using port: ${SERVER_CONFIG.port}`);

    // Connect to database
    await connectDB();
    logger.info('Connected to database');

    // Configure port
    const port = normalizePort(SERVER_CONFIG.port);
    if (!port) {
      throw new Error(`Invalid port: ${SERVER_CONFIG.port}`);
    }

    // Create application and HTTP server
    const app = createApp();
    const server = http.createServer(app);

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }
      const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
      // Specific error messages for common errors
      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Start the server
    server.listen(port, () => {
      const bind = typeof port === 'string' ? 'pipe ' + port : 'port ' + port;
      logger.info(`Server listening on ${bind}`);
      logger.info(`Swagger docs available at http://localhost:${port}${ROUTES_CONFIG.docs}`);
    });

    // Set up graceful shutdown
    setupGracefulShutdown(server);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Sets up handlers for graceful shutdown
 */
function setupGracefulShutdown(server: http.Server): void {
  // Handler for SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    shutdown(server);
  });

  // Handler for SIGTERM (terminate signal)
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    shutdown(server);
  });
}

/**
 * Shuts down the server and disconnects from the database
 */
function shutdown(server: http.Server): void {
  server.close(async () => {
    logger.info('HTTP server closed');
    await disconnectDB();
    logger.info('Process terminated');
    process.exit(0);
  });
}

// Start the server
startServer();
