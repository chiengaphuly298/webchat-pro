# WebChat Pro - Modern Real-time Messaging Application

Modern, luxurious real-time chat application inspired by Discord/Messenger/Telegram with premium UX. Built with React, Node.js, Socket.IO, and Supabase.

![WebChat Pro](https://via.placeholder.com/800x400/0a0a0f/5865f2?text=WebChat+Pro)

## Features

### Core Messaging
- 💬 **Real-time Messaging** - Instant message delivery with Socket.IO
- 👥 **Group Chat** - Create and manage group conversations up to 100 members
- 📎 **File Sharing** - Images, files, and voice messages support
- 🔔 **Notifications** - Real-time push notifications
- ✅ **Read Receipts** - See when messages are read (CheckCheck indicator)
- ✏️ **Edit/Delete Messages** - With soft delete support
- 📌 **Pin Messages** - Important messages stay at top
- 🔄 **Reply Messages** - Reference previous messages in thread

### User Experience
- 🎨 **Premium UI** - Glassmorphism, smooth animations, dark mode
- 🌙 **Dark/Light Mode** - System-aware theme switching
- 📱 **Responsive Design** - Desktop and mobile optimized
- ⚡ **Smooth Animations** - Framer Motion powered transitions
- 💫 **Typing Indicators** - Show when someone is typing
- 🏷️ **Emoji Picker** - Quick reactions and expressions
- 🔍 **Search** - Search users and messages

### Social Features
- 👤 **User Profiles** - Custom avatars and bios
- 🤝 **Friend System** - Send, accept, decline friend requests
- 🚫 **Block Users** - Control who can contact you
- 📊 **Online Status** - Real-time presence indicators

### Technical Excellence
- 🔐 **Secure Authentication** - JWT, Google OAuth, GitHub OAuth
- 🛡️ **Rate Limiting** - Protection against abuse
- 📝 **Input Validation** - Server-side validation
- 🎯 **Clean Architecture** - MVC pattern, separation of concerns
- 💾 **Optimistic Updates** - Fast UI responses

## Tech Stack

### Frontend
- **React 18** + Vite
- **TailwindCSS** - Utility-first CSS
- **Framer Motion** - Animations
- **Zustand** - State management
- **Socket.IO Client** - Real-time communication
- **Lucide React** - Icons
- **date-fns** - Date formatting
- **Sonner** - Toast notifications

### Backend
- **Node.js** + Express
- **Socket.IO** - WebSocket server
- **Supabase** - PostgreSQL + Auth + Storage
- **JWT** - Token authentication
- **Multer** - File uploads
- **Helmet** - Security headers
- **Morgan** - HTTP logging
- **express-rate-limit** - Rate limiting
- **express-validator** - Input validation

### Database
- **Supabase PostgreSQL** - Primary database
- **Row Level Security** - Data protection
- **Realtime Subscriptions** - Live data sync
- **Storage Bucket** - File storage

## Project Structure

```
webchat-pro/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── modals/
│   │   │   │   └── CreateGroupModal.jsx
│   │   │   ├── skeletons/
│   │   │   │   └── MessageSkeleton.jsx
│   │   │   ├── Avatar.jsx
│   │   │   ├── EmojiPicker.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── TypingIndicator.jsx
│   │   ├── hooks/
│   │   │   └── useDebounce.js
│   │   ├── pages/
│   │   │   ├── Chat.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── Register.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── supabase.js
│   │   ├── stores/
│   │   │   ├── authStore.js
│   │   │   ├── conversationStore.js
│   │   │   ├── notificationStore.js
│   │   │   └── socketStore.js
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── rateLimiter.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── conversations.js
│   │   │   ├── friends.js
│   │   │   ├── messages.js
│   │   │   ├── notifications.js
│   │   │   ├── upload.js
│   │   │   └── users.js
│   │   ├── socket/
│   │   │   └── handler.js
│   │   ├── utils/
│   │   │   └── supabase.js
│   │   └── index.js
│   └── package.json
├── supabase/
│   └── schema.sql
├── README.md
└── package.json (optional workspace config)
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd webchat-pro
```

### 2. Setup Supabase Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Copy the contents of `supabase/schema.sql`
4. Paste and execute the SQL query
5. Enable **Realtime** for the following tables:
   - `messages`
   - `message_status`
   - `conversation_members`
   - `notifications`
   - `users`

### 3. Setup Environment Variables

**Frontend** (`frontend/.env`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
```

**Backend** (`backend/.env`):
```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
MAX_FILE_SIZE=10485760
```

### 4. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 5. Start Development Servers

```bash
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Backend
cd backend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Database Schema Overview

### Tables

| Table | Description |
|-------|-------------|
| `users` | User profiles, status, settings |
| `friends` | Friend relationships (pending, accepted, blocked) |
| `conversations` | Direct and group conversations |
| `conversation_members` | Membership in conversations |
| `messages` | All messages with type, metadata, reply_to |
| `message_status` | Delivery and read receipts |
| `attachments` | File/image metadata |
| `notifications` | Push notification records |

### Key Features
- **Row Level Security** enabled on all tables
- **Soft delete** for messages (preserves conversation history)
- **Triggers** auto-update `updated_at` timestamps
- **Functions** for common operations (search, conversation with members)

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login user |
| POST | `/api/v1/auth/logout` | Logout user |
| GET | `/api/v1/auth/me` | Get current user |
| POST | `/api/v1/auth/google` | Google OAuth login |
| POST | `/api/v1/auth/github` | GitHub OAuth login |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/search` | Search users |
| GET | `/api/v1/users/:id` | Get user by ID |
| PUT | `/api/v1/users/profile` | Update profile |
| PUT | `/api/v1/users/settings` | Update settings |

### Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/conversations` | List all conversations |
| POST | `/api/v1/conversations/direct` | Create/get direct chat |
| POST | `/api/v1/conversations/group` | Create group |
| GET | `/api/v1/conversations/:id` | Get conversation |
| PUT | `/api/v1/conversations/:id` | Update group |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/messages/:convId` | Get messages |
| POST | `/api/v1/messages/:convId` | Send message |
| PUT | `/api/v1/messages/:id` | Edit message |
| DELETE | `/api/v1/messages/:id` | Delete message |
| PUT | `/api/v1/messages/:id/pin` | Pin/unpin message |

### Friends
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/friends` | List friends |
| GET | `/api/v1/friends/requests` | Get requests |
| POST | `/api/v1/friends/request` | Send request |
| PUT | `/api/v1/friends/request/:id/accept` | Accept |
| PUT | `/api/v1/friends/request/:id/decline` | Decline |

## Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `send_message` | `{conversation_id, content, type}` | Send message |
| `typing_start` | `{conversation_id}` | User started typing |
| `typing_stop` | `{conversation_id}` | User stopped typing |
| `mark_read` | `{conversation_id, message_id}` | Mark as read |
| `join_conversation` | `conversationId` | Join room |
| `leave_conversation` | `conversationId` | Leave room |
| `update_status` | `{status}` | Update online status |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `message` | New message received |
| `message_sent` | `{message}` | Confirmation |
| `message_edited` | `message` | Message edited |
| `message_deleted` | `{id}` | Message deleted |
| `user_typing` | `{conversation_id, user_id, typing}` | Typing indicator |
| `user_status` | `{user_id, status}` | User online status |
| `message_read` | `{message_id, read_by}` | Read receipt |
| `notification` | `notification` | Push notification |

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL`
3. Deploy automatically on push to main

```bash
# Manual deploy
cd frontend
vercel deploy
```

### Backend (Railway)

1. Create new Railway project
2. Connect GitHub repository
3. Add environment variables
4. Deploy

```bash
# Or use Render
cd backend
render deploy
```

### Backend (Render)

1. Create new Web Service on Render
2. Connect GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables

## Production Checklist

- [ ] Enable HTTPS on all endpoints
- [ ] Set strong `JWT_SECRET`
- [ ] Configure proper CORS origins
- [ ] Enable rate limiting
- [ ] Set up database backups
- [ ] Configure file upload limits
- [ ] Enable Supabase Realtime
- [ ] Set up monitoring/logging
- [ ] Configure DNS/custom domain

## Environment Variables Reference

### Frontend
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_API_URL` | Backend API URL | Yes |

### Backend
| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3001) |
| `NODE_ENV` | Environment | No (default: development) |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `JWT_SECRET` | JWT signing secret (32+ chars) | Yes |
| `JWT_EXPIRES_IN` | Token expiration | No (default: 7d) |
| `CLIENT_URL` | Frontend URL for CORS | Yes |
| `MAX_FILE_SIZE` | Max upload size in bytes | No (default: 10MB) |

## Troubleshooting

### Common Issues

**Socket.IO not connecting**
- Check if backend is running
- Verify CORS configuration
- Check JWT token validity

**Messages not loading**
- Enable Realtime in Supabase dashboard
- Check if user is member of conversation
- Verify database permissions

**File uploads failing**
- Check file size limits
- Verify Supabase storage bucket exists
- Check storage policies

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

Built with ❤️ by WebChat Pro Team - 2026#   w e b c h a t - p r o  
 