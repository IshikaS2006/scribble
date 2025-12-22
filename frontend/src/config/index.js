export const config = {
  server: {
    url: import.meta.env.VITE_SERVER_URL || 'http://localhost:3001',
    reconnectionAttempts: parseInt(import.meta.env.VITE_RECONNECTION_ATTEMPTS || '5', 10),
    reconnectionDelay: parseInt(import.meta.env.VITE_RECONNECTION_DELAY || '1000', 10),
  },

  app: {
    name: 'ShadowDraw',
    version: '1.0.0',
    environment: import.meta.env.MODE || 'development',
  },

  features: {
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableLogging: import.meta.env.VITE_ENABLE_LOGGING !== 'false',
  },

  canvas: {
    defaultWidth: parseInt(import.meta.env.VITE_CANVAS_WIDTH || '800', 10),
    defaultHeight: parseInt(import.meta.env.VITE_CANVAS_HEIGHT || '600', 10),
  },
};

export default config;
