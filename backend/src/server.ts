// Core dependencies
import express, { Express, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import path from 'path';
import fs from 'fs';

// Middleware packages
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { isValidObjectId } from 'mongoose';

// Application middleware
import { errorHandler, notFound, ApiError } from './middleware/error.middleware';

// Configuration
import { swaggerSpec } from './config/swagger';
import { CORS_CONFIG } from './config/app';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import certificationRoutes from './routes/certification.routes';
import uploadRoutes from './routes/upload.routes';
import categoryRoutes from './routes/category.routes';

// Ensure uploads directory exists with proper permissions
const uploadsDir = path.join(__dirname, '../uploads');
const profilesDir = path.join(uploadsDir, 'profiles');
const certificationsDir = path.join(uploadsDir, 'certifications');

// Create directories if they don't exist
[uploadsDir, profilesDir, certificationsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } catch (err) {
      console.error(`Failed to create directory: ${dir}`, err);
    }
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
});

// Log permissions for debugging
try {
  fs.accessSync(certificationsDir, fs.constants.W_OK);
  console.log(`Directory ${certificationsDir} is writable`);
} catch (err) {
  console.error(`Directory ${certificationsDir} is not writable:`, err);
}

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
  
  // Enhanced static file service options
  const staticOptions = {
    setHeaders: (res: Response, filePath: string) => {
      // Permitir acceso desde cualquier origen
      res.set('Access-Control-Allow-Origin', '*');
      
      // Establecer el tipo de contenido correcto basado en la extensión del archivo
      if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        res.set('Content-Type', 'image/jpeg');
      } else if (filePath.endsWith('.png')) {
        res.set('Content-Type', 'image/png');
      } else if (filePath.endsWith('.pdf')) {
        res.set('Content-Type', 'application/pdf');
      }
      
      // Disable caching for development
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    }
  };
  
  // Explicitly serve upload directories
  app.use('/uploads', express.static(path.join(__dirname, '../uploads'), staticOptions));
  app.use('/uploads/certifications', express.static(path.join(__dirname, '../uploads/certifications'), staticOptions));
  app.use('/uploads/profiles', express.static(path.join(__dirname, '../uploads/profiles'), staticOptions));
  
  // Log upload paths for debugging
  console.log(`Serving static files from: ${path.join(__dirname, '../uploads')}`);
  console.log(`Certifications path: ${path.join(__dirname, '../uploads/certifications')}`);
  
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
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/certifications', certificationRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/categories', categoryRoutes);

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
