import { Router, Response } from 'express';
import { Note } from '../models/Note';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/notes (Paginated)
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const skip = (page - 1) * limit;

    const isUser = req.user?.role === 'user';
    const filter = isUser ? { userId: req.user?.userId } : {};

    const [notes, total] = await Promise.all([
      Note.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email'),
      Note.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      data: notes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('Fetch notes error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Internal server error' },
    });
  }
});

// POST /api/notes
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Title and content are required' },
      });
    }

    const note = await Note.create({
      title,
      content,
      userId: req.user?.userId,
    });

    return res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: note,
    });
  } catch (error: any) {
    console.error('Create note error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Internal server error' },
    });
  }
});

// GET /api/notes/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const note = await Note.findById(req.params.id).populate('userId', 'username email');

    if (!note) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Note not found' },
      });
    }

    if (req.user?.role !== 'admin' && note.userId._id.toString() !== req.user?.userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }

    return res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error: any) {
    console.error('Get note error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Internal server error' },
    });
  }
});

// PUT /api/notes/:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Note not found' },
      });
    }

    if (req.user?.role !== 'admin' && note.userId.toString() !== req.user?.userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }

    const { title, content } = req.body;
    if (title) note.title = title;
    if (content) note.content = content;

    await note.save();

    return res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: note,
    });
  } catch (error: any) {
    console.error('Update note error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Internal server error' },
    });
  }
});

// DELETE /api/notes/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Note not found' },
      });
    }

    if (req.user?.role !== 'admin' && note.userId.toString() !== req.user?.userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }

    await note.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete note error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Internal server error' },
    });
  }
});

export default router;
