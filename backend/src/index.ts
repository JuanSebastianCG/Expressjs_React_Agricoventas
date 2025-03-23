import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { notFound, errorHandler } from './middleware/error.middleware';
import cookieParser from 'cookie-parser';
import { connectDB, disconnectDB } from './config/db';
import { pino } from 'pino';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

dotenv.config();

export const logger = pino({ name: 'server start' });
const PORT: number = parseInt(process.env.PORT as string, 10) || 3000;

const app = express();

// CORS Middleware
const corsOptions = {
  origin: process.env.APP_ENV == 'development' ? '*' : process.env.ORIGIN,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
// JSON Middleware & Form Data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cookie parser middleware
app.use(cookieParser());

// Connect to database
connectDB()
  .then(() => {
    logger.info('Connected to database');
  })
  .catch((err) => {
    logger.error('Failed to connect to database', err);
    process.exit(1);
  });

// Main Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Not Found Middleware
app.use(notFound);

// Error Handling Middleware
app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Handle shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    disconnectDB().finally(() => {
      process.exit(0);
    });
  });
});
