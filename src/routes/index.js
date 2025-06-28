/**
 * Routes Index
 *
 * This module aggregates and exports all route definitions
 * from a single entry point.
 */
import express from "express";
import userRoutes from "./user_routes.js";

const router = express.Router();

// Define API routes
router.use("/users", userRoutes);

// Root path response
router.get("/", (req, res) => {
  res.json({
    message: "API is running",
    version: "1.0.0",
  });
});

export default router;
