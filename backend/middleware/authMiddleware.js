import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found." });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token invalid." });
  }
};

export const isTeacher = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized." });
  }

  if (req.user.role !== "Teacher") {
    return res.status(403).json({ message: "Forbidden: teachers only." });
  }

  return next();
};

export const isStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized." });
  }

  if (req.user.role !== "Student") {
    return res.status(403).json({ message: "Forbidden: students only." });
  }

  return next();
};

export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized." });
  }

  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Forbidden: admin only." });
  }

  return next();
};
