export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { DIFY_API_URL, DIFY_API_KEY } = process.env;

    // Allow overrides from headers
    const targetUrl = req.headers.get('X-Dify-Url') || DIFY_API_URL;
    const authHeader = req.headers.get('Authorization') || `Bearer ${DIFY_API_KEY}`;

    if (!targetUrl || !authHeader) {
      return new Response('Missing configuration', { status: 500 });
    }

    const body = await req.json();

    const response = await fetch(`${targetUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    return response;
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
