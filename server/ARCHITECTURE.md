# Server Architecture Overview

## 📊 Request Flow

### REST API Flow
```
Client Request
    ↓
server.js (Express App)
    ↓
routes/index.js (Route Matching)
    ↓
controllers/roomController.js (Business Logic)
    ↓
utils/roomStore.js (Data Storage)
    ↓
Response to Client
```

### Socket.io Flow
```
Client Socket Event
    ↓
server.js (Socket.io Server)
    ↓
sockets/index.js (Event Router)
    ↓
sockets/handlers.js (Event Logic)
    ↓
utils/roomStore.js (Data Operations)
    ↓
Broadcast to Room/User(s)
```

## 🗂️ Module Responsibilities

### **server.js** (Entry Point)
- Initialize Express app
- Configure middleware (CORS, JSON)
- Setup Socket.io
- Start HTTP server
- **Lines of code**: ~30

### **config/index.js** (Configuration)
- Load environment variables
- Export configuration object
- CORS settings
- Port configuration

### **routes/index.js** (Route Definitions)
- Define REST API endpoints
- Map routes to controllers
- Route-level middleware

### **controllers/roomController.js** (Request Handlers)
- `createRoom()` - Generate roomId & adminKey
- `getHealthStatus()` - Server stats
- HTTP request/response logic
- Error handling

### **sockets/index.js** (Socket Initialization)
- Register socket event listeners
- Route events to handlers

### **sockets/handlers.js** (Socket Logic)
- `handleJoinRoom()` - User joins room
- `handlePublicStroke()` - Public drawing
- `handlePrivateStroke()` - Private drawing
- `handlePromoteStroke()` - Private → Public
- `handleDisconnect()` - Cleanup

### **utils/roomStore.js** (Data Layer)
- In-memory room storage
- CRUD operations for rooms
- User-socket mapping
- Stroke management
- Room cleanup

### **utils/helpers.js** (Utilities)
- `generateAdminKey()` - Crypto key generation
- Shared helper functions

## 🔄 Data Flow Examples

### Example 1: User Joins Room
```
1. Client emits: socket.emit('joinRoom', {roomId, userId, adminKey})
2. sockets/index.js receives event
3. Calls handlers.handleJoinRoom(io, socket, data)
4. Handler validates roomId & userId
5. roomStore.createRoom() if needed
6. roomStore.verifyAdminKey() if adminKey provided
7. roomStore.addUserSocket(roomId, userId, socketId)
8. socket.join(roomId) - Join Socket.io room
9. Emit 'room-joined' to user
10. Broadcast 'users-update' to room
```

### Example 2: Drawing a Stroke
```
1. Client emits: socket.emit('public-stroke', stroke)
2. sockets/handlers.handlePublicStroke(io, socket, stroke)
3. Validate socket.data.roomId exists
4. roomStore.addPublicStroke(roomId, strokeData)
5. socket.to(roomId).emit('public-stroke', strokeData)
6. All other users in room receive the stroke
```

### Example 3: Multi-Tab Support
```
User opens 2 tabs (Tab A, Tab B):

Tab A connects → userId: "user123", socketId: "abc"
Tab B connects → userId: "user123", socketId: "def"

roomStore.users["user123"] = Set("abc", "def")

Private stroke from Tab A:
- roomStore gets Set("abc", "def")
- Sends stroke to socketId "def" (Tab B)
- Both tabs see the same private layer
```

## 🏛️ Design Patterns Used

### 1. **Separation of Concerns**
- Routes define endpoints
- Controllers handle business logic
- Utils manage data

### 2. **Singleton Pattern**
- `roomStore` is exported as single instance
- Shared state across all modules

### 3. **Factory Pattern**
- `generateAdminKey()` creates keys
- Room creation in roomStore

### 4. **Observer Pattern**
- Socket.io event-driven architecture
- Broadcast updates to subscribers

### 5. **Repository Pattern**
- roomStore abstracts data operations
- Easy to swap in-memory → database

## 📈 Scalability Considerations

### Current Architecture (Single Server)
```
[Client] ← WebSocket → [server.js + roomStore in-memory]
```

### Future: Horizontal Scaling
```
[Client 1] → [Server 1] ↘
                          [Redis Pub/Sub + Shared Storage]
[Client 2] → [Server 2] ↗
```

**Needed Changes**:
1. Replace `roomStore` with Redis/Database
2. Use Redis Adapter for Socket.io
3. Shared session store
4. Load balancer with sticky sessions

## 🔐 Security Layers

```
Client Request
    ↓
CORS Middleware (config/cors)
    ↓
Express JSON Parser
    ↓
[Future: Rate Limiting]
    ↓
[Future: JWT Validation]
    ↓
Admin Key Verification (sockets/handlers)
    ↓
Business Logic
```

## 🧪 Testing Strategy

### Unit Tests (Recommended)
- `utils/helpers.js` - Pure functions
- `utils/roomStore.js` - Data operations
- `controllers/*.js` - HTTP handlers

### Integration Tests
- `routes/` + `controllers/` - REST API
- `sockets/handlers.js` - Socket events

### E2E Tests
- Full client → server flow
- Multi-user scenarios

## 📝 Code Metrics

| Module | Responsibility | LoC | Complexity |
|--------|---------------|-----|------------|
| server.js | Bootstrap | 30 | Low |
| config/ | Configuration | 15 | Low |
| routes/ | Routing | 10 | Low |
| controllers/ | HTTP Logic | 40 | Medium |
| sockets/ | Socket Logic | 150 | Medium |
| utils/roomStore | Data Layer | 140 | Medium |
| utils/helpers | Utilities | 10 | Low |

**Total**: ~395 lines (down from 280 in single file, but much more maintainable)

## 🎯 Benefits of This Structure

✅ **Maintainability**: Easy to find and fix bugs  
✅ **Testability**: Each module can be tested independently  
✅ **Scalability**: Clear upgrade path to database/Redis  
✅ **Readability**: New developers can understand quickly  
✅ **Reusability**: Utils and helpers are reusable  
✅ **Standards**: Follows Node.js/Express best practices  
✅ **Debugging**: Clear stack traces with module names  
✅ **Collaboration**: Multiple devs can work on different modules
