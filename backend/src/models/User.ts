import mongoose from "mongoose";
import { IUser } from "../types";
import { userSchema } from "../schemas";

/**
 * User Model
 *
 * Creates a Mongoose model for users using the centralized schema.
 * This approach separates the schema definition from the model creation,
 * making the code more modular and maintainable.
 */
const User = mongoose.model<IUser>("User", userSchema);

export default User;
