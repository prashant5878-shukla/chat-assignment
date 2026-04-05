# Real-time Group Chat System

A clean, modular, and feature-rich real-time group chat application built with Node.js, Socket.IO, and React.

## Features

- **Real-time Messaging**: Instant message delivery using Socket.IO.
- **Group Management**: Create groups, add/remove members, and manage roles (Admin, Write, Read).
- **Media Support**: Upload images, audio files, and documents directly to AWS S3.
- **Secure Authentication**: JWT-based auth with role-based access control.
- **Admin Panel**: Global dashboard for Superadmins to manage users and groups.
- **Typing Indicators**: Real-time "user is typing" feedback.
- **Message Read Receipts**: Track who has read each message.
- **Rate Limiting**: Integrated protection against abuse and excessive S3 costs.

## Tech Stack

- **Backend**: Node.js, Express.js, Socket.IO, MongoDB (Mongoose), JWT, AWS S3 SDK v3.
- **Frontend**: React (Vite), TailwindCSS, Socket.IO-client, Axios.

## Prerequisites

- Node.js (v16+)
- MongoDB (Local or Atlas)
- AWS S3 Bucket (Access Key, Secret, and Bucket Name)

## Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd chat-assignment
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Fill in your MONGO_URI, JWT_SECRET, and AWS Credentials in .env
```

### 3. Seed Database
```bash
npm run seed
```
This will create:
- **Superadmin**: admin@example.com / password123
- **Writer**: writer@example.com / password123
- **Reader**: reader@example.com / password123

### 4. Frontend Setup
```bash
cd ../client
npm install
npm run dev
```

## API Endpoints

### Auth
- `POST /api/auth/register`: Create a new account.
- `POST /api/auth/login`: Authenticate and get token.

### Groups
- `GET /api/groups`: List user's groups.
- `POST /api/groups`: Create a new group.
- `POST /api/groups/:groupId/members`: Add member to group.
- `PATCH /api/groups/:groupId/members/:userId`: Change member role.
- `DELETE /api/groups/:groupId/members/:userId`: Remove member.

### Messages
- `GET /api/messages/:groupId`: Fetch paginated group history.
- `POST /api/messages/upload`: Upload file to S3.

### Admin
- `GET /api/admin/users`: List all users.
- `PATCH /api/admin/users/:userId`: Ban/Unban user.
- `GET /api/admin/groups`: List all groups.
- `DELETE /api/admin/groups/:groupId`: Delete group.

## Socket Events

### Client -> Server
- `join_group`: `{ groupId }`
- `leave_group`: `{ groupId }`
- `send_message`: `{ groupId, type, content, fileKey, fileName, mimeType }`
- `typing_start`: `{ groupId }`
- `typing_stop`: `{ groupId }`
- `message_read`: `{ messageId }`

### Server -> Client
- `new_message`: Full message object.
- `user_typing`: `{ userId, username }`
- `user_stopped_typing`: `{ userId }`
- `user_online`: `{ userId, username }`
- `user_offline`: `{ userId }`
- `message_seen`: `{ messageId, userId, readAt }`
- `error`: Error message.

## License
MIT
