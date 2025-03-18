import { Document } from "mongoose";

/**
 * User Interface Definition
 *
 * This interface defines the TypeScript type for User documents.
 */
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * User Registration Data Interface
 * 
 * Used for type checking when handling registration requests
 */
export interface IUserRegistrationData {
  name: string;
  email: string;
  password: string;
}

/**
 * User Login Data Interface
 * 
 * Used for type checking when handling login requests
 */
export interface IUserLoginData {
  email: string;
  password: string;
}

/**
 * User JWT Payload Interface
 * 
 * Defines the structure of the data that will be encoded in the JWT
 */
export interface IUserJwtPayload {
  id: string;
} 