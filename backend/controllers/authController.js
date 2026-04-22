const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const emailPattern = /^\S+@\S+\.\S+$/;

const buildAuthResponse = (user, message, statusCode, res) => {
  const token = generateToken(user);

  return res.status(statusCode).json({
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
};

const signup = async (req, res) => {
  try {
    const { name = "", email = "", password = "" } = req.body;

    if (!name.trim() || !email.trim() || !password.trim()) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    return buildAuthResponse(user, "Signup successful.", 201, res);
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Unable to create account right now." });
  }
};

const login = async (req, res) => {
  try {
    const { email = "", password = "" } = req.body;

    if (!email.trim() || !password.trim()) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return buildAuthResponse(user, "Login successful.", 200, res);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Unable to log in right now." });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User account was not found." });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({ message: "Unable to load the user profile." });
  }
};

module.exports = { signup, login, getProfile };
