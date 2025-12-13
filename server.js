const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const requestData = JSON.parse(body);

        const apiData = JSON.stringify({
          model: requestData.model,
          messages: requestData.messages,
          temperature: requestData.temperature || 0.8,
          max_tokens: requestData.max_tokens || 150
        });

        const options = {
          hostname: 'api.groq.com',
          path: '/openai/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Length': Buffer.byteLength(apiData)
          }
        };

        const apiReq = https.request(options, (apiRes) => {
          let responseData = '';

          apiRes.on('data', chunk => {
            responseData += chunk;
          });

          apiRes.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(responseData);
          });
        });

        apiReq.on('error', (error) => {
          console.error('API Error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to process request' }));
        });

        apiReq.write(apiData);
        apiReq.end();

      } catch (error) {
        console.error('Server Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`🐺 Wolf server running on port ${PORT}`);
});