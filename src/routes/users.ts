import { Router, Response } from 'express';
import { User, UserRole } from '../models/User';
import { authenticate, authorizeRole, AuthenticatedRequest } from '../middleware/auth';
import { hashPassword } from '../lib/jwt';

const router = Router();

router.use(authenticate);
router.use(authorizeRole('admin'));

// GET /api/users (Paginated Admin User List)
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Internal server error' },
    });
  }
});

// POST /api/users (Admin Add User)
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
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

    const userObj = newUser.toObject();
    delete userObj.passwordHash;

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userObj,
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Internal server error' },
    });
  }
});

// PUT /api/users/:id (Admin Update User)
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    const { username, email, role, interests, password } = req.body;

    if (username) user.username = username;
    if (email) user.email = email.toLowerCase();
    if (role && Object.values(UserRole).includes(role)) user.role = role;
    if (Array.isArray(interests)) user.interests = interests;
    if (password) user.passwordHash = await hashPassword(password);

    await user.save();

    const userObj = user.toObject();
    delete userObj.passwordHash;

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: userObj,
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Internal server error' },
    });
  }
});

// DELETE /api/users/:id (Admin Remove User)
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    await user.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Internal server error' },
    });
  }
});

export default router;
