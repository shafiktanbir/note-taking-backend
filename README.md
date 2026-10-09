# 🚀 Secure Note-Taking REST API (Backend)

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Production%20Live-brightgreen?logo=vercel)](https://note-taking-backend-opal.vercel.app/api/health)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas%20Cluster-green?logo=mongodb)](https://www.mongodb.com/cloud/atlas)

Production-grade REST API backend built with **Node.js**, **Express**, **TypeScript**, and **Mongoose (MongoDB Atlas)**, designed for zero-downtime serverless execution on **Vercel**.

---

## 🔗 Live Production URLs & Repositories

- **Live Production API Base URL:** [`https://note-taking-backend-opal.vercel.app/api`](https://note-taking-backend-opal.vercel.app/api)
- **API Health Check Endpoint:** [`https://note-taking-backend-opal.vercel.app/api/health`](https://note-taking-backend-opal.vercel.app/api/health)
- **Frontend App Live URL:** [`https://note-taking-frontend-lyart.vercel.app`](https://note-taking-frontend-lyart.vercel.app)
- **GitHub Backend Repository:** [`https://github.com/shafiktanbir/note-taking-backend`](https://github.com/shafiktanbir/note-taking-backend)
- **GitHub Frontend Repository:** [`https://github.com/shafiktanbir/note-taking-frontend`](https://github.com/shafiktanbir/note-taking-frontend)

---

## 🏗️ System Architecture & Key Features

```
note-taking-backend/
├── src/
│   ├── index.ts               # Express application entry & CORS middleware
│   ├── lib/
│   │   ├── db.ts              # Serverless Mongoose connection pool client
│   │   └── jwt.ts             # JWT token issuance & bcrypt password security
│   ├── middleware/
│   │   └── auth.ts            # JWT authentication & RBAC (user vs admin) middleware
│   ├── models/
│   │   ├── User.ts            # User schema + 3 explicit schema.index() calls
│   │   ├── Note.ts            # Note schema + 2 explicit schema.index() calls
│   │   └── Post.ts            # Post schema + 1 explicit schema.index() call
│   ├── routes/
│   │   ├── auth.ts            # /api/auth/register & /api/auth/login
│   │   ├── notes.ts           # /api/notes CRUD (paginated)
│   │   ├── users.ts           # /api/users Admin management (paginated)
│   │   └── aggregations.ts    # /api/aggregations (Scenario 1 & Scenario 2)
│   └── scripts/
│       ├── seed.ts            # npm run seed (database seed script)
│       └── verify-indexes.ts  # npm run verify-indexes (index audit)
├── .env.example
├── package.json
├── tsconfig.json
└── vercel.json                # Vercel serverless deployment config
```

### Key Technical Highlights:
1. **Serverless Connection Caching:** Implements `global.mongooseCache` in `src/lib/db.ts` to prevent MongoDB connection leaks across Vercel lambda executions.
2. **Stateless JWT Auth & RBAC:** Hashed passwords (`bcryptjs`), token signing (`jsonwebtoken`), and strict `user` vs `admin` role protection.
3. **CORS Protocol:** Configured for cross-origin credentials (`CLIENT_ORIGIN`) to allow seamless integration with `note-taking-frontend`.

---

## ⚡ Strict Database Indexing Audit (Exactly 6 Custom Indexes)

> **Golden Constraint:** All indexes are declared explicitly in code using `schema.index()`. Zero unnecessary indexes exist.

| Model | Index Key Definition | Index Type | Query / Pipeline Stage Supported |
| :--- | :--- | :--- | :--- |
| `User` | `{ email: 1 }` | `unique: true` | `User.findOne({ email })` for O(1) Auth lookup. |
| `User` | `{ createdAt: -1 }` | Single field | `User.find().sort({ createdAt: -1 })` for Admin user list. |
| `User` | `{ interests: 1 }` | Multikey | Aggregation Scenario 1 (`$unwind: "$interests"`). |
| `Note` | `{ userId: 1, createdAt: -1 }` | Compound | `Note.find({ userId }).sort({ createdAt: -1 })` for User notes. |
| `Note` | `{ createdAt: -1 }` | Single field | `Note.find().sort({ createdAt: -1 })` for Admin system notes. |
| `Post` | `{ userId: 1 }` | Single field | Aggregation Scenario 2 (`$lookup` join target foreign key). |

---

## 📊 MongoDB Aggregation Pipelines

### Scenario 1: Group Users by Interests (`GET /api/aggregations/interests`)
- **Constraint:** Uses **exactly ONE `collection.aggregate()` call**.
- **Pipeline:**
  ```typescript
  const data = await User.aggregate([
    { $unwind: '$interests' },
    { $group: { _id: '$interests', userCount: { $sum: 1 }, users: { $push: { id: '$_id', username: '$username', email: '$email', role: '$role' } } } },
    { $sort: { userCount: -1 } },
  ]);
  ```

### Scenario 2: User Posts `$lookup` (`GET /api/aggregations/user-posts`)
- **Constraint:** Uses a single aggregation pipeline with a `$lookup` stage.
- **Pipeline:**
  ```typescript
  const data = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    { $lookup: { from: 'posts', localField: '_id', foreignField: 'userId', as: 'posts' } },
    { $project: { passwordHash: 0 } },
  ]);
  ```

---

## 🔐 Pre-Seeded Test Credentials

| Role | Email | Password | Pre-seeded Data |
| :--- | :--- | :--- | :--- |
| **Regular User** | `john@example.com` | `User123!` | 2 Notes, 2 Posts, Interests: `chess`, `coding`, `gaming` |
| **Regular User** | `jane@example.com` | `User123!` | 1 Note, 1 Post, Interests: `reading`, `painting` |
| **Administrator** | `admin@example.com` | `Admin123!` | Admin role, Interests: `chess`, `architecture`, `reading` |

---

## 🛠️ Quick Start & Local Setup

```bash
# 1. Clone repository
git clone https://github.com/shafiktanbir/note-taking-backend.git
cd note-taking-backend

# 2. Install dependencies
npm install

# 3. Environment configuration
cp .env.example .env

# 4. Seed MongoDB Atlas database
npm run seed

# 5. Run Mongoose strict index verification audit
npm run verify-indexes

# 6. Start local development server
npm run dev
# Server running at http://localhost:5000
```

---

## 🧪 Deployment & Verification Commands

```bash
# Build TypeScript distribution
npm run build

# Deploy to Vercel Production
vercel --prod --yes \
  -e MONGODB_URI="mongodb+srv://shafiktanbir:1234567890@cluster0.o9sii.mongodb.net/note_taking_db?retryWrites=true&w=majority" \
  -e JWT_SECRET="secure_note_taking_jwt_secret_key_32bytes_min_2026"
```
