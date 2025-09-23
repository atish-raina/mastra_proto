// Vercel API route for comments agent chat
import { mastra } from '../../.mastra/output/index.mjs';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Invalid request body. Expected { messages: ChatMessage[] }'
      });
    }

    // Set up Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial connection confirmation
    res.write('data: {"type": "connected"}\n\n');

    try {
      // Get the comments agent from mastra
      const commentsAgent = mastra.agents.commentsAgent;
      
      // Stream the agent's response
      const stream = await commentsAgent.generateText({
        messages: messages.map(msg => ({
          role: msg.role,
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
      res.write(`data: {"type": "error", "message": "Agent processing failed: ${agentError.message}"}\n\n`);
      res.end();
    }

  } catch (error) {
    console.error('Route error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    } else {
      res.write(`data: {"type": "error", "message": "Internal server error"}\n\n`);
      res.end();
    }
  }
}
