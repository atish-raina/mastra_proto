/**
 * Simple test script for the comments agent
 * Run with: npx tsx src/test-comments-agent.ts
 */

import { commentsAgent } from './mastra/agents/commentsAgent';

async function testCommentsAgent() {
  console.log('🧪 Testing Comments Agent...\n');

  try {
    // Test 1: Basic comment fetching
    console.log('Test 1: Fetching comments from post 1');
    const response1 = await commentsAgent.generateText({
      messages: [
        {
          role: 'user',
          content: 'Show me comments from post 1'
        }
      ]
    });
    console.log('Response:', response1.text);
    console.log('---\n');

    // Test 2: Limited results
    console.log('Test 2: Fetching first 3 comments');
    const response2 = await commentsAgent.generateText({
      messages: [
        {
          role: 'user',
          content: 'Show me the first 3 comments'
        }
      ]
    });
    console.log('Response:', response2.text);
    console.log('---\n');

    // Test 3: Search by email
    console.log('Test 3: Searching by email');
    const response3 = await commentsAgent.generateText({
      messages: [
        {
          role: 'user',
          content: 'Find comments from someone with email containing "example"'
        }
      ]
    });
    console.log('Response:', response3.text);
    console.log('---\n');

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCommentsAgent();
}
