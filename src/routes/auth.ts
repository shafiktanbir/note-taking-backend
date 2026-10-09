import { Router, Request, Response } from 'express';
import { User, UserRole } from '../models/User';
import { hashPassword, comparePassword, signToken } from '../lib/jwt';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, role, interests } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Username, email, and password are required' },
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'User with this email already exists' },
      });
    }

    const passwordHash = await hashPassword(password);
    const assignedRole = role === 'admin' ? UserRole.ADMIN : UserRole.USER;
    const userInterests = Array.isArray(interests) ? interests : [];

    const newUser = await User.create({
      username,
      email: email.toLowerCase(),
      passwordHash,
      role: assignedRole,
      interests: userInterests,
    });

    const token = signToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          interests: newUser.interests,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Internal server error' },
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Email and password are required' },
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' },
      });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' },
      });
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          interests: user.interests,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Internal server error' },
    });
  }
});

export default router;
