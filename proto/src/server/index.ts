import express from 'express';
import { createCommentsApp } from './commentsRoute';

/**
 * Example server setup for the comments agent
 * This demonstrates how to run the comments agent with Express
 */

const PORT = process.env.PORT || 3000;

const app = createCommentsApp();

// Root endpoint with usage instructions
app.get('/', (req, res) => {
  res.json({
    message: 'Comments Agent API',
    endpoints: {
      'POST /api/comments/chat': 'Chat with the comments agent (streams responses via SSE)',
      'GET /api/comments/health': 'Health check for the comments agent',
      'GET /': 'This help message'
    },
    example: {
      method: 'POST',
      url: '/api/comments/chat',
      body: {
        messages: [
          {
            role: 'user',
            content: 'Show me comments from post 1'
          }
        ]
      }
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Comments Agent server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/comments/health`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/comments/chat`);
});

export default app;
