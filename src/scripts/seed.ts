import dotenv from 'dotenv';
import { connectToDatabase } from '../lib/db';
import { User, UserRole } from '../models/User';
import { Note } from '../models/Note';
import { Post } from '../models/Post';
import { hashPassword } from '../lib/jwt';

dotenv.config();

async function seedDatabase() {
  console.log('--- Starting Database Seeding ---');
  await connectToDatabase();

  // Clean existing collections for reproducible test state
  await Promise.all([
    User.deleteMany({}),
    Note.deleteMany({}),
    Post.deleteMany({}),
  ]);

  console.log('Cleared existing database records.');

  // Create Passwords
  const adminPasswordHash = await hashPassword('Admin123!');
  const user1PasswordHash = await hashPassword('User123!');
  const user2PasswordHash = await hashPassword('User123!');

  // Create Users
  const adminUser = await User.create({
    username: 'admin_user',
    email: 'admin@example.com',
    passwordHash: adminPasswordHash,
    role: UserRole.ADMIN,
    interests: ['chess', 'architecture', 'reading'],
  });

  const regularUser1 = await User.create({
    username: 'john_doe',
    email: 'john@example.com',
    passwordHash: user1PasswordHash,
    role: UserRole.USER,
    interests: ['chess', 'coding', 'gaming'],
  });

  const regularUser2 = await User.create({
    username: 'jane_smith',
    email: 'jane@example.com',
    passwordHash: user2PasswordHash,
    role: UserRole.USER,
    interests: ['reading', 'painting'],
  });

  console.log(`Created 3 users (1 Admin, 2 Regular Users).`);

  // Create Notes for Regular User 1
  await Note.create([
    {
      title: 'Database Indexing Strategy',
      content: 'Must use explicit schema.index declarations for review visibility.',
      userId: regularUser1._id,
    },
    {
      title: 'MongoDB Aggregations',
      content: 'Scenario 1 requires single collection.aggregate() call for interests grouping.',
      userId: regularUser1._id,
    },
    {
      title: 'Vercel Serverless Notes',
      content: 'Reuse Mongoose socket connections using global mongooseCache.',
      userId: regularUser2._id,
    },
  ]);

  console.log(`Created 3 notes across users.`);

  // Create Posts for Aggregation Scenario 2 ($lookup)
  await Post.create([
    {
      title: 'First Tech Post by John',
      body: 'Exploring MongoDB indexing performance and ESMR rules.',
      userId: regularUser1._id,
    },
    {
      title: 'Second Tech Post by John',
      body: 'Understanding $lookup stage performance with foreign key indexing.',
      userId: regularUser1._id,
    },
    {
      title: 'Jane Art Review',
      body: 'Overview of modern digital art techniques.',
      userId: regularUser2._id,
    },
  ]);

  console.log(`Created 3 posts in separate Posts collection for $lookup testing.`);

  console.log('\n=== Database Seeding Complete ===');
  console.log('Test Credentials:');
  console.log('Admin User: admin@example.com / Admin123!');
  console.log('Regular User 1: john@example.com / User123!');
  console.log('Regular User 2: jane@example.com / User123!');

  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('Database seeding failed:', err);
  process.exit(1);
});
