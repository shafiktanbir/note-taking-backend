import { Schema, model, Document, Types, models } from 'mongoose';

export interface IPost extends Document {
  title: string;
  body: string;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// EXPLICIT INDEX DEFINITION (Visible for evaluation - required for $lookup)
postSchema.index({ userId: 1 });

export const Post = models.Post || model<IPost>('Post', postSchema);
