// Vercel API route for comments agent chat
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Define the comment interface
const CommentSchema = z.object({
  postId: z.number(),
  id: z.number(),
  name: z.string(),
  email: z.string(),
  body: z.string(),
});

// Create the fetchComments tool
const fetchComments = createTool({
  id: 'fetch-comments',
  description: 'Fetch comments from JSONPlaceholder API with optional filtering',
  inputSchema: z.object({
    id: z.number().optional().describe('Filter comments by specific comment ID'),
    postId: z.number().optional().describe('Filter comments by post ID'),
    email: z.string().optional().describe('Filter comments by email address'),
    name: z.string().optional().describe('Filter comments by name'),
    limit: z.number().optional().describe('Limit the number of results returned (applied client-side)'),
  }),
  outputSchema: z.array(CommentSchema),
  execute: async ({ context }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (context.id !== undefined) {
        queryParams.append('id', context.id.toString());
      }
      if (context.postId !== undefined) {
        queryParams.append('postId', context.postId.toString());
      }
      if (context.email !== undefined) {
        queryParams.append('email', context.email);
      }
      if (context.name !== undefined) {
        queryParams.append('name', context.name);
      }

      const baseUrl = 'https://jsonplaceholder.typicode.com/comments';
      const url = queryParams.toString() 
        ? `${baseUrl}?${queryParams.toString()}`
        : baseUrl;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status} ${response.statusText}`);
      }

      const comments = await response.json();
      const limitedComments = context.limit 
        ? comments.slice(0, context.limit)
        : comments;

      return limitedComments;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw new Error(`Failed to fetch comments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Create the comments agent
const commentsAgent = new Agent({
  name: 'comments-agent',
  instructions: `
    You are a helpful assistant that answers user questions about comments. 
    Always call the fetchComments tool when relevant to provide accurate information.
    
    When responding to user queries:
    - Use the fetchComments tool to retrieve comment data when needed
    - Provide clear and helpful answers based on the comment data
    - If asked about specific comments, posts, or users, use appropriate filters
    - Be concise but informative in your responses
    - If no comments are found matching the criteria, let the user know
    - Always be polite and professional
  `,
  model: openai('gpt-4o-mini'),
  tools: { fetchComments },
  memory: new Memory({
    storage: new LibSQLStore({
      url: ':memory:',
    }),
  }),
});

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
