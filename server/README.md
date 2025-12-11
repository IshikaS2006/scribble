# Scribble Server

Real-time collaborative drawing server built with Express, Socket.io, and Node.js.

## 📁 Project Structure

```
server/
├── config/
│   └── index.js              # Configuration management (port, CORS, env)
├── controllers/
│   └── roomController.js     # REST API request handlers
├── routes/
│   └── index.js              # Express route definitions
├── sockets/
│   ├── index.js              # Socket.io initialization
│   └── handlers.js           # Socket event handlers
├── utils/
│   ├── roomStore.js          # In-memory room storage & management
│   └── helpers.js            # Utility functions (adminKey generation)
├── .env.example              # Environment variables template
├── server.js                 # Application entry point
└── package.json              # Dependencies and scripts
```

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure environment variables in `.env`:
   ```env
   PORT=3001
   NODE_ENV=development
   FRONTEND_ORIGIN=http://localhost:5173
   ```

### Running the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

## 📡 API Endpoints

### REST API

#### Create Room
```http
POST /rooms
```
**Response:**
```json
{
  "roomId": "uuid-v4-string",
  "adminKey": "32-character-hex-string"
}
```

#### Health Check
```http
GET /
```
**Response:**
```json
{
  "status": "Server is running",
  "rooms": 5,
  "totalUsers": 12,
  "timestamp": "2025-12-11T..."
}
```

### Socket.io Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `joinRoom` | `{ roomId, userId, adminKey? }` | Join a room |
| `public-stroke` | `{ id, points, color, width }` | Draw on public layer |
| `private-stroke` | `{ id, points, color, width }` | Draw on private layer |
| `promote-stroke` | `{ strokeIds: [...] }` | Promote private strokes to public |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room-joined` | `{ roomId, userId, isAdmin, publicStrokes, userCount }` | Confirmation of room join |
| `users-update` | `{ count }` | User count changed |
| `public-stroke` | `{ id, from, stroke, createdAt }` | New public stroke broadcast |
| `private-stroke` | `{ id, points, color, width }` | Private stroke to user's devices |
| `error` | `{ message }` | Error notification |

## 🏗️ Architecture

### Room Storage (`utils/roomStore.js`)
In-memory storage with the following structure:
```javascript
rooms[roomId] = {
  adminKey: string,           // Generated on room creation
  adminId: string,            // First user to join with adminKey
  publicStrokes: [...],       // Visible to all users
  privateStrokes: {           // Per-user private strokes
    userId: [...]
  },
  users: {                    // Multi-tab/device support
    userId: Set(socketId, ...)
  }
}
```

### Key Features
- **Multi-tab support**: Same user can connect from multiple devices/tabs
- **Admin verification**: Admin key checked on join
- **Automatic cleanup**: Empty rooms are removed
- **Private/Public layers**: Separate drawing layers per user

## 🔧 Configuration

### CORS
Configured via `FRONTEND_ORIGIN` environment variable:
- Development: `http://localhost:5173`
- Production: Set to your frontend domain

### Port
Default: `3001`, configurable via `PORT` environment variable

## 📝 Logging

The server logs all major events:
- 🏠 Room creation/auto-creation
- 🔑 Admin key generation
- 👤 User joins/leaves
- 📤 Public strokes
- 🔒 Private strokes
- 📢 Stroke promotions
- ❌ Disconnections
- 🗑️ Room cleanup

## 🧪 Testing

Test the API:
```bash
# Create a room
curl -X POST http://localhost:3001/rooms

# Health check
curl http://localhost:3001/
```

## 📦 Dependencies

- **express** - Web framework
- **socket.io** - Real-time bidirectional communication
- **cors** - Cross-origin resource sharing
- **uuid** - Unique ID generation
- **dotenv** - Environment variable management

### Dev Dependencies
- **nodemon** - Auto-reload during development

## 🔐 Security Notes

- Admin keys are 32-character hexadecimal strings
- CORS should be restricted in production
- Consider adding rate limiting for production
- Room data is in-memory (will be lost on restart)

## 🚧 Future Enhancements

- [ ] Database persistence (PostgreSQL/MongoDB)
- [ ] Redis for distributed sessions
- [ ] Rate limiting middleware
- [ ] JWT authentication
- [ ] Room expiration/TTL
- [ ] Stroke history pagination
- [ ] WebRTC for peer-to-peer drawing

## 📄 License

ISC
