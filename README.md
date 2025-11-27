# Dify Chat Stream

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-18.3.1-61dafb.svg)
![Vite](https://img.shields.io/badge/vite-5.4.1-646cff.svg)

A minimal, modern React application for chatting with Dify AI Agents, supporting streaming responses and Markdown rendering.

## Features

- **Streaming Responses**: Real-time typing effect from Dify API.
- **Markdown Support**: Renders rich text, code blocks, and tables using `react-markdown`.
- **Dual Deployment Modes**:
    - **Proxy Mode**: For local development and Vercel (Serverless Function).
    - **Direct Mode**: For static hosting like GitHub Pages (Client-side API calls).
- **Dynamic Configuration**:
    - Settings UI to configure API URL and Key at runtime.
    - Supports multiple users connecting to different Dify instances.
    - Environment variable fallbacks.


## Getting Started

### Prerequisites

- Node.js 18+
- A Dify App (Chatflow or Agent) with an API Key.

### Local Development

1.  Clone the repository.
    ```bash
    git clone https://github.com/yourusername/dify-chat-stream.git
    cd dify-chat-stream
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file (optional, or use Settings UI):
    ```env
    DIFY_API_URL=https://api.dify.ai/v1
    DIFY_API_KEY=app-your-key
    ```
4.  Start the development server:
    ```bash
    npm start
    ```

### Deployment

#### Vercel (Recommended)

1.  Import the project into Vercel.
2.  Set Environment Variables in Vercel Project Settings:
    - `DIFY_API_URL`
    - `DIFY_API_KEY`
3.  Deploy.

#### GitHub Pages

1.  Push to your GitHub repository.
2.  Go to **Settings > Secrets and variables > Actions**.
3.  Add `DIFY_API_KEY` as a Repository Secret.
4.  Add `DIFY_API_URL` as a Repository Variable.
5.  The included GitHub Actions workflow will automatically build and deploy to the `gh-pages` branch.
6.  Go to **Settings > Pages** and ensure the source is set to "GitHub Actions".

## Configuration Priority

The application resolves API configuration in this order:
1.  **User Settings**: Manually entered in the UI (saved in Local Storage).
2.  **Environment Variables**: `DIFY_API_URL` and `DIFY_API_KEY` injected at build or runtime.

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
