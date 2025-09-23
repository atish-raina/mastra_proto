// Vercel API route for the root endpoint
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.status(200).json({
    message: 'Comments Agent API',
    version: '1.0.0',
    endpoints: {
      'POST /api/comments/chat': 'Chat with the comments agent (streams responses via SSE)',
      'GET /api/comments/health': 'Health check for the comments agent',
      'GET /api': 'This help message'
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
    },
    documentation: 'See COMMENTS_AGENT_README.md for detailed usage instructions'
  });
}
