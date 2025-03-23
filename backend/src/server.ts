// Core dependencies
import express, { Express, Request, Response } from 'express';

// Middleware packages
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

// Application middleware
import { errorHandler, notFound } from './middleware/error.middleware';

// Configuration
import { swaggerSpec } from './config/swagger';
import { CORS_CONFIG, ROUTES_CONFIG } from './config/app';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

/**
 * Configura y crea la aplicación Express
 *
 * @returns La aplicación Express configurada
 */
export function createApp(): Express {
  // Initialize Express
  const app: Express = express();

  // Middlewares for security and parsing
  app.use(cors(CORS_CONFIG));
  app.use(helmet());
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Swagger Documentation
  app.use(ROUTES_CONFIG.docs, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get(`${ROUTES_CONFIG.docs}.json`, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Routes
  app.use(ROUTES_CONFIG.auth, authRoutes);
  app.use(ROUTES_CONFIG.users, userRoutes);

  // Root route
  app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to Agricoventas API' });
  });

  // Error handling middleware - siempre al final
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
