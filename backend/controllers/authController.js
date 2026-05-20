const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const generateToken = require("../utils/generateToken");

const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role === "ADMIN" ? "ADMIN" : "MEMBER",
    },
  });

  const token = generateToken(user);
  return res.status(201).json({
    message: "User registered successfully",
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken(user);
  return res.json({
    message: "Login successful",
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};

const getMe = async (req, res) => {
  return res.json({ user: req.user });
};

module.exports = { register, login, getMe };
