/**
 * User Controller
 *
 * This controller handles HTTP requests related to users.
 */
import { userService } from "../services/index.js";
import { asyncHandler } from "../utils/errors.js";
import logger from "../config/logger.js";

/**
 * Handle user registration
 */
export const registerUser = asyncHandler(async (req, res) => {
  const userData = req.body;

  logger.info(`Received registration request for ${userData.email}`);
  const user = await userService.registerUser(userData);

  res.status(201).json({
    success: true,
    data: user,
  });
});

/**
 * Get user by ID
 */
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await userService.getUserById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: `User not found with id: ${id}`,
    });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * Get all users
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});
