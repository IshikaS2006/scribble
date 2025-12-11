require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  frontendOrigin: process.env.FRONTEND_ORIGIN || '*',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // CORS configuration
  cors: {
    origin: process.env.FRONTEND_ORIGIN || ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST']
  }
};
