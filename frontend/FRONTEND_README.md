# ShadowDraw Frontend

A modern, collaborative drawing application built with React and Vite. This frontend provides a real-time whiteboard experience for online interviews and collaborative sessions.

## 🚀 Features

- **Real-time Collaboration**: Multiple users can draw simultaneously
- **Canvas Operations**: Pan, zoom, and draw with precision
- **Private & Public Layers**: Separate drawing layers for students and administrators
- **Undo/Redo**: Full history management for drawing operations
- **Room Management**: Create and join private drawing rooms
- **Responsive UI**: Modern, accessible interface with Tailwind CSS
- **Error Handling**: Robust error boundaries for better UX

## 🛠️ Tech Stack

- **React 19** - UI framework with latest features
- **Vite** - Lightning-fast build tool
- **Socket.IO Client** - Real-time bidirectional communication
- **Tailwind CSS** - Utility-first CSS framework
- **PropTypes** - Runtime type checking for React props

## 📦 Installation

\`\`\`bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
\`\`\`

## 🔧 Configuration

Create a \`.env.local\` file in the frontend directory:

\`\`\`env
VITE_SERVER_URL=http://localhost:3001
VITE_DEBUG_MODE=false
VITE_ENABLE_LOGGING=true
\`\`\`

See \`.env.example\` for all available options.

## 📁 Project Structure

\`\`\`
src/
├── components/          # React components
│   ├── DrawingCanvas.jsx
│   ├── DrawingToolbar.jsx
│   ├── ErrorBoundary.jsx
│   ├── JoinRoomForm.jsx
│   ├── LayersSidebar.jsx
│   └── TopNavBar.jsx
├── hooks/              # Custom React hooks
│   ├── useSocket.js
│   ├── useCamera.js
│   └── useLocalStorage.js
├── utils/              # Utility functions
│   └── canvasDrawing.js
├── constants/          # Application constants
│   └── index.js
├── config/             # Environment configuration
│   └── index.js
├── App.jsx             # Main application component
├── Canvas.jsx          # Main canvas component
├── main.jsx            # Application entry point
└── socket.js           # Socket.IO configuration
\`\`\`

## 🎯 Key Components

### DrawingCanvas
Main canvas component that handles:
- Pointer events (draw, pan, zoom)
- Canvas rendering
- Undo/Redo operations

### DrawingToolbar
Toolbar with drawing tools:
- Pen, Pencil, Marker, Highlighter
- Color selection
- Tool state management

### LayersSidebar
Manages drawing layers:
- Public/Private stroke visualization
- Promotion requests (for admins)
- User role display

### JoinRoomForm
Room joining interface:
- Room ID input
- User authentication
- Connection status

## 🎨 Custom Hooks

### useSocket
Manages Socket.IO connection lifecycle:
\`\`\`jsx
const { socket, isConnected, connectionError } = useSocket();
\`\`\`

### useCamera
Handles canvas camera operations:
\`\`\`jsx
const { camera, zoom, pan, screenToWorld } = useCamera();
\`\`\`

### useLocalStorage
Persists state to localStorage:
\`\`\`jsx
const [value, setValue] = useLocalStorage('key', defaultValue);
\`\`\`

## 🧪 Available Scripts

\`\`\`bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
\`\`\`

## 🎨 Styling

This project uses Tailwind CSS for styling. Configuration is in \`tailwind.config.js\`.

Custom styles are in:
- \`index.css\` - Global styles
- \`App.css\` - App-specific styles
- \`Canvas.css\` - Canvas-specific styles

## 🔒 Code Quality

### PropTypes Validation
All components include PropTypes for runtime type checking:

\`\`\`jsx
Component.propTypes = {
  prop: PropTypes.string.isRequired,
};
\`\`\`

### Error Boundaries
The app uses error boundaries to catch and handle errors gracefully.

### ESLint
Configured with React-specific rules in \`eslint.config.js\`.

## 🌐 Environment Support

- **Development**: Hot module replacement, detailed logging
- **Production**: Optimized builds, minimal logging

## 📱 Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features
- Requires JavaScript enabled

## 🤝 Contributing

1. Follow the existing code structure
2. Use PropTypes for all components
3. Write descriptive commit messages
4. Test across different browsers

## 📄 License

Private educational project.

## 🆘 Troubleshooting

### Socket connection issues
- Check if backend server is running
- Verify \`VITE_SERVER_URL\` in \`.env.local\`
- Check browser console for errors

### Canvas not rendering
- Check browser console
- Verify canvas dimensions
- Clear browser cache

### Build errors
- Delete \`node_modules\` and reinstall
- Check Node.js version (>=18 recommended)
- Clear Vite cache: \`rm -rf node_modules/.vite\`

## 📞 Support

For issues and questions, refer to the project documentation or contact the development team.
