# Comments Agent

A Mastra agent that can fetch and answer questions about comments from the JSONPlaceholder API.

## Features

- **Fetch Comments Tool**: Retrieves comments from `https://jsonplaceholder.typicode.com/comments`
- **Flexible Filtering**: Filter by `id`, `postId`, `email`, `name`, or apply a `limit`
- **Streaming Responses**: Express route with Server-Sent Events (SSE) support
- **Type Safety**: Full TypeScript support with Zod validation
- **Production Ready**: Proper error handling and logging

## Files Structure

```
src/
├── mastra/
│   ├── agents/
│   │   └── commentsAgent.ts          # Main agent definition
│   └── tools/
│       └── fetchComments.ts          # Tool for fetching comments
└── server/
    ├── commentsRoute.ts              # Express routes for the agent
    └── index.ts                      # Example server setup
```

## Usage

### 1. Direct Agent Usage

```typescript
import { commentsAgent } from './mastra/agents/commentsAgent';

const response = await commentsAgent.generateText({
  messages: [
    {
      role: 'user',
      content: 'Show me comments from post 1'
    }
  ]
});
```

### 2. Express Server

```typescript
import { createCommentsApp } from './server/commentsRoute';

const app = createCommentsApp();
app.listen(3000);
```

### 3. API Endpoints

#### POST /api/comments/chat
Streams responses from the comments agent.

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Show me comments from post 1"
    }
  ]
}
```

**Response:** Server-Sent Events stream
```
data: {"type": "connected"}

data: {"type": "chunk", "content": "I'll"}

data: {"type": "chunk", "content": " fetch"}

data: {"type": "done"}
```

#### GET /api/comments/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "agent": "comments-agent",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Tool Parameters

The `fetchComments` tool accepts the following parameters:

- `id` (optional): Filter by specific comment ID
- `postId` (optional): Filter by post ID
- `email` (optional): Filter by email address
- `name` (optional): Filter by name
- `limit` (optional): Limit number of results (applied client-side)

## Example Queries

- "Show me all comments"
- "Find comments from post 5"
- "Show me comments by user with email 'example@email.com'"
- "Get the first 10 comments"
- "Find comments containing 'amazing' in the body"

## Error Handling

The agent includes comprehensive error handling:

- Network errors when fetching from the API
- Invalid request format validation
- Agent processing errors
- Graceful degradation with informative error messages

## Development

To run the example server:

```bash
cd proto
npm run dev
```

The server will start on `http://localhost:3000` with the comments agent available at `/api/comments/chat`.
