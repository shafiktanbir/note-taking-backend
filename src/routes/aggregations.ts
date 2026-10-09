import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';

const router = Router();

// GET /api/aggregations/interests
// Scenario 1: Group by Interests
// Constraint: Exactly ONE collection.aggregate() call.
router.get('/interests', async (req: Request, res: Response) => {
  try {
    const data = await User.aggregate([
      // Stage 1: Deconstruct interests array
      { $unwind: '$interests' },

      // Stage 2: Group users by interest
      {
        $group: {
          _id: '$interests',
          userCount: { $sum: 1 },
          users: {
            $push: {
              id: '$_id',
              username: '$username',
              email: '$email',
              role: '$role',
            },
          },
        },
      },

      // Stage 3: Sort by interest frequency descending
      { $sort: { userCount: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Aggregation Scenario 1 error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Internal server error' },
    });
  }
});

// GET /api/aggregations/user-posts?userId=<userId>
// Scenario 2: User Posts ($lookup)
// Constraint: Single aggregation pipeline with $lookup stage.
router.get('/user-posts', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    const pipeline: any[] = [];

    // Optional match stage if userId query parameter is provided
    if (userId && typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
      pipeline.push({ $match: { _id: new mongoose.Types.ObjectId(userId) } });
    }

    // Stage: $lookup join against Posts collection
    pipeline.push(
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'userId',
          as: 'posts',
        },
      },
      {
        $project: {
          passwordHash: 0,
        },
      }
    );

    const data = await User.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Aggregation Scenario 2 error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Internal server error' },
    });
  }
});

export default router;
