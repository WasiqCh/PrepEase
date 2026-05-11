import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/authMiddleware.js";
import { createUser, listUsers, updateUser, deleteUser } from "../controllers/adminController.js";
import { createUserRules } from "../middleware/validator.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(isAdmin);

router.post("/create-user", createUserRules, createUser);
router.get("/users", listUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

export default router;
