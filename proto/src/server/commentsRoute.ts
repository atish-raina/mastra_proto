import express, { Request, Response } from 'express';
import { commentsAgent } from '../mastra/agents/commentsAgent';

/**
 * Express route handler for the comments agent
 * Accepts { messages } in JSON and streams the agent's responses via SSE
 */

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

/**
 * POST /api/comments/chat
 * Streams responses from the comments agent using Server-Sent Events
 */
export const commentsChatRoute = async (req: Request, res: Response) => {
  try {
    const { messages }: ChatRequest = req.body;

    // Validate request body
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Invalid request body. Expected { messages: ChatMessage[] }'
      });
    }

    // Validate message format
    for (const message of messages) {
      if (!message.role || !message.content) {
        return res.status(400).json({
          error: 'Invalid message format. Each message must have role and content'
        });
      }
      if (!['user', 'assistant', 'system'].includes(message.role)) {
        return res.status(400).json({
          error: 'Invalid message role. Must be user, assistant, or system'
        });
      }
    }

    // Set up Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    // Send initial connection confirmation
    res.write('data: {"type": "connected"}\n\n');

    try {
      // Stream the agent's response
      const stream = await commentsAgent.generateText({
        messages: messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        }))
      });

      // Stream each chunk as it arrives
      for await (const chunk of stream.textStream) {
        res.write(`data: {"type": "chunk", "content": "${chunk.replace(/"/g, '\\"')}"}\n\n`);
      }

      // Send completion signal
      res.write('data: {"type": "done"}\n\n');
      res.end();

    } catch (agentError) {
      console.error('Agent error:', agentError);
      res.write(`data: {"type": "error", "message": "Agent processing failed: ${agentError instanceof Error ? agentError.message : 'Unknown error'}"}\n\n`);
      res.end();
    }

  } catch (error) {
    console.error('Route error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } else {
      res.write(`data: {"type": "error", "message": "Internal server error"}\n\n`);
      res.end();
    }
  }
};

/**
 * GET /api/comments/health
 * Health check endpoint for the comments agent
 */
export const commentsHealthRoute = (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    agent: 'comments-agent',
    timestamp: new Date().toISOString()
  });
};

/**
 * Example Express app setup
 * This shows how to integrate the comments routes into an Express application
 */
export const createCommentsApp = () => {
  const app = express();
  
  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // CORS middleware for development
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  
  // Routes
  app.post('/api/comments/chat', commentsChatRoute);
  app.get('/api/comments/health', commentsHealthRoute);
  
  return app;
};
