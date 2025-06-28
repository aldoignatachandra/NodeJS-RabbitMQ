/**
 * User Routes
 *
 * This module defines API routes related to user operations.
 */
import express from "express";
import * as userController from "../controllers/user_controller.js";

const router = express.Router();

/**
 * @route   POST /api/users
 * @desc    Register a new user
 * @access  Public
 */
router.post("/", userController.registerUser);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Public
 */
router.get("/", userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get a user by ID
 * @access  Public
 */
router.get("/:id", userController.getUserById);

export default router;
