import dotenv from 'dotenv';
import { connectToDatabase } from '../lib/db';
import { User } from '../models/User';
import { Note } from '../models/Note';
import { Post } from '../models/Post';

dotenv.config();

async function verifyIndexes() {
  console.log('--- Starting Mongoose Strict Indexing Audit ---');
  await connectToDatabase();

  // Ensure indexes are built in database
  await Promise.all([
    User.syncIndexes(),
    Note.syncIndexes(),
    Post.syncIndexes(),
  ]);

  const userIndexes = await User.collection.indexes();
  const noteIndexes = await Note.collection.indexes();
  const postIndexes = await Post.collection.indexes();

  console.log('\nUser Collection Indexes:');
  userIndexes.forEach((idx) => console.log(` - Name: ${idx.name}, Key: ${JSON.stringify(idx.key)}`));

  console.log('\nNote Collection Indexes:');
  noteIndexes.forEach((idx) => console.log(` - Name: ${idx.name}, Key: ${JSON.stringify(idx.key)}`));

  console.log('\nPost Collection Indexes:');
  postIndexes.forEach((idx) => console.log(` - Name: ${idx.name}, Key: ${JSON.stringify(idx.key)}`));

  // Count explicit custom indexes (excluding default _id_)
  const customUserIndexes = userIndexes.filter((idx) => idx.name !== '_id_');
  const customNoteIndexes = noteIndexes.filter((idx) => idx.name !== '_id_');
  const customPostIndexes = postIndexes.filter((idx) => idx.name !== '_id_');

  const totalCustomIndexes = customUserIndexes.length + customNoteIndexes.length + customPostIndexes.length;

  console.log(`\nExplicit Custom Index Counts:`);
  console.log(` - User: ${customUserIndexes.length} (Expected: 3 - email, createdAt, interests)`);
  console.log(` - Note: ${customNoteIndexes.length} (Expected: 2 - userId+createdAt, createdAt)`);
  console.log(` - Post: ${customPostIndexes.length} (Expected: 1 - userId)`);
  console.log(`Total Custom Indexes Across Models: ${totalCustomIndexes} (Expected: 6)`);

  if (totalCustomIndexes === 6) {
    console.log('\n✅ INDEX AUDIT PASSED: Exactly 6 explicit custom indexes exist. Zero unnecessary indexes detected.');
  } else {
    console.warn(`\n⚠️ INDEX AUDIT WARNING: Expected 6 custom indexes, found ${totalCustomIndexes}.`);
  }

  process.exit(0);
}

verifyIndexes().catch((err) => {
  console.error('Index verification failed:', err);
  process.exit(1);
});
