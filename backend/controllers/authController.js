const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log('[AUTH] Register attempt:', {
      name: name || '(missing)',
      email: email || '(missing)',
      passwordLength: password ? password.length : 0,
    });

    if (!name || !email || !password) {
      console.warn('[AUTH] Register validation failed: missing fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      console.warn('[AUTH] Register validation failed: password too short');
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('[AUTH] Checking for existing user:', normalizedEmail);

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      console.warn('[AUTH] Register failed: email already exists:', normalizedEmail);
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    console.log('[AUTH] Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('[AUTH] Password hashed successfully');

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });
    console.log('[AUTH] User created in MongoDB:', user._id);

    if (!process.env.JWT_SECRET) {
      console.error('[AUTH] JWT_SECRET is not set!');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    console.log('[AUTH] Generating JWT...');
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('[AUTH] JWT generated successfully for user:', user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[AUTH] Register error:', error.message);
    if (error.code === 11000) {
      console.warn('[AUTH] Duplicate key error (race condition)');
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    if (error.name === 'ValidationError') {
      console.warn('[AUTH] Mongoose validation error:', error.message);
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('[AUTH] Login attempt:', {
      email: email || '(missing)',
      passwordProvided: !!password,
    });

    if (!email || !password) {
      console.warn('[AUTH] Login validation failed: missing fields');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('[AUTH] Looking up user:', normalizedEmail);

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.warn('[AUTH] Login failed: user not found:', normalizedEmail);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('[AUTH] User found, comparing password...');
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.warn('[AUTH] Login failed: password mismatch for:', normalizedEmail);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('[AUTH] Password matched for:', normalizedEmail);

    if (!process.env.JWT_SECRET) {
      console.error('[AUTH] JWT_SECRET is not set!');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    console.log('[AUTH] Generating JWT...');
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('[AUTH] JWT generated successfully for user:', user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login };
