import { Router } from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
} from "../controllers/userController";
import { protect } from "../middlewares/auth";
import { body } from "express-validator";

const router = Router();

// Validation middleware
const validateRegistration = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const validateLogin = [
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Routes
router.post("/register", validateRegistration, registerUser);
router.post("/login", validateLogin, loginUser);
router.get("/profile", protect, getUserProfile);

export default router;
