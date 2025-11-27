import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    envPrefix: ['VITE_', 'DIFY_'],
    base: env.VITE_BASE_PATH || '/',
    plugins: [
      react(),
      {
        name: 'api-proxy-middleware',
        configureServer(server) {
          server.middlewares.use('/api/chat-messages', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }

            try {
              const { DIFY_API_URL, DIFY_API_KEY } = env;

              // Allow overrides from headers
              const targetUrl = (req.headers['x-dify-url'] as string) || DIFY_API_URL;
              const authHeader = req.headers['authorization'] || `Bearer ${DIFY_API_KEY}`;

              if (!targetUrl || !authHeader) {
                res.statusCode = 500;
                res.end('Missing configuration');
                return;
              }

              // Read body
              const buffers = [];
              for await (const chunk of req) {
                buffers.push(chunk);
              }
              const body = Buffer.concat(buffers).toString();

              const response = await fetch(`${targetUrl}/chat-messages`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': authHeader,
                },
                body: body,
              });

              // Stream response back
              res.statusCode = response.status;
              response.headers.forEach((value, key) => {
                res.setHeader(key, value);
              });

              if (response.body) {

                for await (const chunk of response.body) {
                  res.write(chunk);
                }
              }
              res.end();
            } catch (error) {
              console.error('Proxy error:', error);
              res.statusCode = 500;
              res.end('Internal Server Error');
            }
          });
        },
      },
    ],
    server: {
      // Proxy removed in favor of middleware plugin
    },
  }
})
