import { prisma } from '../prisma';
import { PrismaClientInitializationError } from '@prisma/client/runtime/library';

/**
 * Connect to the database using Prisma
 *
 * This function attempts to establish a connection to the database
 * and reports the status of the connection.
 */
export const connectDB = async (): Promise<void> => {
  try {
    // Test the connection by executing a simple query
    await prisma.$connect();
    console.log('MongoDB connected successfully');
  } catch (error) {
    if (error instanceof PrismaClientInitializationError) {
      console.error('Failed to connect to MongoDB:', error.message);
    } else {
      console.error('Unexpected error when connecting to MongoDB:', error);
    }

    // If we can't connect to the database, exit the process
    process.exit(1);
  }
};

/**
 * Disconnect from the database
 *
 * This function cleanly disconnects from the database.
 * It should be called when the application is shutting down.
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('MongoDB disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
};
