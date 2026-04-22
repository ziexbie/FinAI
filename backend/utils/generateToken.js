const jwt = require("jsonwebtoken");

// Keep the token payload small and focused on data the UI needs after login.
const generateToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      name: user.name,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

module.exports = generateToken;
