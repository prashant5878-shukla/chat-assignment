# Real-time Group Chat System

A clean, modular, and feature-rich real-time group chat application built with Node.js, Socket.IO, and React.

## Features

- **Real-time Messaging**: Instant message delivery using Socket.IO.
- **Media Support**: Upload images, audio files, and documents directly to AWS S3.
- **Secure Authentication**: JWT-based auth with role-based access control.
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
