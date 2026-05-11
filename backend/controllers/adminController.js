import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const createUser = async (req, res) => {
  console.log("[Admin] Create user request received.");
  console.log("[Admin] Request body:", req.body);

  try {
    const {
      firstName,
      lastName,
      email,
      role,
      password,
      department,
      semester,
      subjects,
      assignedDepartments,
      assignedSemesters,
      assignedSubjects,
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !role || !password) {
      console.log("[Admin] Missing required fields.");
      return res.status(400).json({ message: "All fields (firstName, lastName, email, role, password) are required." });
    }

    if (!["Student", "Teacher"].includes(role)) {
      console.log("[Admin] Invalid role:", role);
      return res.status(400).json({ message: "Role must be 'Student' or 'Teacher'." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    // Check for existing user
    console.log("[Admin] Checking for existing user with email:", email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("[Admin] User already exists:", email);
      return res.status(409).json({ message: "User with this email already exists." });
    }

    // Hash password
    console.log("[Admin] Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    console.log(`[Admin] Creating ${role} user...`);
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      department: role === "Student" ? department : "",
      semester: role === "Student" ? semester : "",
      subjects: role === "Student" ? subjects : [],
      assignedDepartments: role === "Teacher" ? assignedDepartments : [],
      assignedSemesters: role === "Teacher" ? assignedSemesters : [],
      assignedSubjects: role === "Teacher" ? assignedSubjects : [],
    });

    console.log("[Admin] User created successfully:", user._id);
    return res.status(201).json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.department,
      semester: user.semester,
      subjects: user.subjects,
      assignedDepartments: user.assignedDepartments,
      assignedSemesters: user.assignedSemesters,
      assignedSubjects: user.assignedSubjects,
      message: `${role} account created successfully.`,
    });
  } catch (error) {
    console.error("[Admin] Create user error:", error);
    console.error("[Admin] Error message:", error.message);
    return res.status(500).json({ message: "Failed to create user.", error: error.message });
  }
};

export const listUsers = async (req, res) => {
  console.log("[Admin] List users request received.");

  try {
    const { role, page = 1, limit = 10 } = req.query;

    let filter = {};
    if (role && ["Student", "Teacher", "Admin"].includes(role)) {
      filter.role = role;
    }

    const skip = (page - 1) * limit;
    const users = await User.find(filter)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    console.log(`[Admin] Retrieved ${users.length} users.`);
    return res.status(200).json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Admin] List users error:", error);
    return res.status(500).json({ message: "Failed to list users.", error: error.message });
  }
};

export const updateUser = async (req, res) => {
  console.log("[Admin] Update user request received.");
  console.log("[Admin] User ID:", req.params.id);
  console.log("[Admin] Request body:", req.body);

  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      password,
      department,
      semester,
      subjects,
      assignedDepartments,
      assignedSemesters,
      assignedSubjects,
    } = req.body;

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Block role updates
    if (req.body.role) {
      console.log("[Admin] Attempt to update role blocked.");
      return res.status(403).json({ message: "Role cannot be updated. Contact system administrator." });
    }

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (user.role === "Student") {
      if (department !== undefined) user.department = department;
      if (semester !== undefined) user.semester = semester;
      if (subjects !== undefined) user.subjects = subjects;
    }
    if (user.role === "Teacher") {
      if (assignedDepartments !== undefined) user.assignedDepartments = assignedDepartments;
      if (assignedSemesters !== undefined) user.assignedSemesters = assignedSemesters;
      if (assignedSubjects !== undefined) user.assignedSubjects = assignedSubjects;
    }
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters." });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    console.log("[Admin] User updated successfully:", user._id);

    return res.status(200).json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      message: "User updated successfully.",
    });
  } catch (error) {
    console.error("[Admin] Update user error:", error);
    return res.status(500).json({ message: "Failed to update user.", error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  console.log("[Admin] Delete user request received.");
  console.log("[Admin] User ID:", req.params.id);

  try {
    const { id } = req.params;

    // Prevent deleting the last admin
    const adminCount = await User.countDocuments({ role: "Admin" });
    const user = await User.findById(id);

    if (user && user.role === "Admin" && adminCount === 1) {
      console.log("[Admin] Attempt to delete last admin blocked.");
      return res.status(403).json({ message: "Cannot delete the last admin account." });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    console.log("[Admin] User deleted successfully:", id);
    return res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("[Admin] Delete user error:", error);
    return res.status(500).json({ message: "Failed to delete user.", error: error.message });
  }
};
