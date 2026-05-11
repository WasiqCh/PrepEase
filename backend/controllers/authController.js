import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "24h" });

export const login = async (req, res) => {
  console.log("[Auth] Login request received.");
  console.log("[Auth] Request body:", req.body);

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("[Auth] Missing email or password for login.");
      return res.status(400).json({ message: "Email and password are required." });
    }

    console.log("[Auth] Finding user:", email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log("[Auth] User not found:", email);
      return res.status(401).json({ message: "Invalid credentials." });
    }

    console.log("[Auth] Comparing password...");
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("[Auth] Password mismatch for user:", email);
      return res.status(401).json({ message: "Invalid credentials." });
    }

    console.log("[Auth] Login successful for user:", email);
    return res.status(200).json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("[Auth] Login error:", error);
    console.error("[Auth] Error message:", error.message);
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
};
