import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Define the comment interface based on JSONPlaceholder API response
interface Comment {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}

// Input schema for the tool
const inputSchema = z.object({
  id: z.number().optional().describe('Filter comments by specific comment ID'),
  postId: z.number().optional().describe('Filter comments by post ID'),
  email: z.string().optional().describe('Filter comments by email address'),
  name: z.string().optional().describe('Filter comments by name'),
  limit: z.number().optional().describe('Limit the number of results returned (applied client-side)'),
});

// Output schema for the tool
const outputSchema = z.array(z.object({
  postId: z.number(),
  id: z.number(),
  name: z.string(),
  email: z.string(),
  body: z.string(),
}));

export const fetchComments = createTool({
  id: 'fetch-comments',
  description: 'Fetch comments from JSONPlaceholder API with optional filtering',
  inputSchema,
  outputSchema,
  execute: async ({ context }) => {
    try {
      // Build query parameters
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

      // Construct the API URL
      const baseUrl = 'https://jsonplaceholder.typicode.com/comments';
      const url = queryParams.toString() 
        ? `${baseUrl}?${queryParams.toString()}`
        : baseUrl;

      // Fetch data from the API
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status} ${response.statusText}`);
      }

      const comments: Comment[] = await response.json();

      // Apply client-side limit if specified
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
