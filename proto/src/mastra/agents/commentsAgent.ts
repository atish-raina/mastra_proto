import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { fetchComments } from '../tools/fetchComments';

/**
 * Comments Agent - A Mastra agent that can fetch and answer questions about comments
 * from the JSONPlaceholder API (https://jsonplaceholder.typicode.com/comments)
 */
export const commentsAgent = new Agent({
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
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});
