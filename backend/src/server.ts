// Core dependencies
import express, { Express, Request, Response, NextFunction, ErrorRequestHandler } from 'express';

// Middleware packages
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

// Application middleware
import { errorHandler, notFound, ApiError } from './middleware/error.middleware';

// Configuration
import { swaggerSpec } from './config/swagger';
import { CORS_CONFIG, ROUTES_CONFIG } from './config/app';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
/**
 * Middleware para manejar errores específicos de CORS
 */
const corsErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err.name === 'CORSError' || (err.message && err.message.includes('CORS'))) {
    console.error('CORS Error intercepted:', err);
    res.status(403).json({
      success: false,
      error: {
        code: 'CORS_ERROR',
        message: 'Cross-Origin Request Blocked: The request was blocked due to CORS policy.',
        details: {
          suggestion: 'Ensure your request has the correct headers and that the server is configured to accept requests from your origin.'
        }
      }
    });
    return;
  }
  next(err);
};

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
  
  // Configuración menos restrictiva de Helmet para Swagger
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
    })
  );
  
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  
  // Middleware para manejar preflight OPTIONS requests
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept');
      res.status(200).send();
      return;
    }
    next();
  });

  // Swagger Documentation
  app.use(ROUTES_CONFIG.docs, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get(`${ROUTES_CONFIG.docs}.json`, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Routes
  app.use(ROUTES_CONFIG.auth, authRoutes);
  app.use(ROUTES_CONFIG.users, userRoutes);
  app.use(ROUTES_CONFIG.products, productRoutes);
  app.use(ROUTES_CONFIG.orders, orderRoutes); 

  // Root route
  app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to Agricoventas API' });
  });

  // Manejador de errores CORS específico
  app.use(corsErrorHandler);
  
  // Error handling middleware - siempre al final
  app.use(notFound);
  app.use(errorHandler);

  // Handle uncaught exceptions to prevent app crash
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  return app;
}
