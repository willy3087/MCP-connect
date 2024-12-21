# MCP Bridge

    ███╗   ███╗ ██████╗██████╗     ██████╗ ██████╗ ██��██████╗  ██████╗ ███████╗
    ████╗ ████║██╔════╝██╔══██╗    ██╔══██╗██╔══██╗██║██╔══██╗██╔════╝ ██╔════╝
    ██╔████╔██║██║     ██████╔╝    ██████╔╝██████╔╝██║██║  ██║██║  ███╗█████╗  
    ██║╚██╔╝██║██║     ██╔═══╝     ██╔══██╗██╔══██╗██║██║  ██║██║   ██║██╔══╝  
    ██║ ╚═╝ ██║╚██████╗██║         ██████╔╝██║  ██║██║██████╔╝╚██████╔╝███████╗
    ╚═╝     ╚═╝ ╚═════╝╚═╝         ╚═════╝ ╚═╝  ╚═╝╚═╝╚═════╝  ╚═════╝ ╚══════╝

The Model Context Protocol (MCP) introduced by Anthropic is cool. However, most MCP servers are built on Stdio transport, which, while excellent for accessing local resources, limits their use in cloud-based applications.

MCP bridge is a tiny tool that is created to solve this problem:

- **Cloud Integration**: Enables cloud-based AI services to interact with local Stdio based MCP servers
- **Protocol Translation**: Converts HTTP/HTTPS requests to Stdio communication
- **Security**: Provides secure access to local resources while maintaining control
- **Flexibility**: Supports various MCP servers without modifying their implementation

By bridging this gap, we can leverage the full potential of local MCP tools in cloud-based AI applications without compromising on security.

## How it works

```
+-----------------+     HTTPS/SSE      +------------------+      stdio      +------------------+
|                 |                    |                  |                 |                  |
|  Cloud AI tools | <--------------->  |  Node.js Bridge  | <------------>  |    MCP Server    |
|   (Remote)      |       Tunnels      |    (Local)       |                 |     (Local)      |
|                 |                    |                  |                 |                  |
+-----------------+                    +------------------+                 +------------------+
```

## Prerequisites

- Node.js

## Installation

1. Clone the repository
2. Copy `.env.example` to `.env` and configure the port and auth_token:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the bridge
   ```bash
   npm run build
   npm start
   ```
5. Run the bridge in dev mode (supports hot reloading by nodemon)
   ```bash
   npm run dev
   ```
Now MCP bridge is running on `http://localhost:3000`.

Note:
- The bridge is designed to be run on a local machine, so you still need to build a tunnel to the local MCP server that is accessible from the cloud.
- Ngrok, Cloudflare Zero Trust, and LocalTunnel are recommended for building the tunnel.

## Configuration

Required environment variables:

- `AUTH_TOKEN`: Authentication token for the bridge API
- `PORT`: HTTP server port (default: 3000)
- `LOG_LEVEL`: Logging level (default: info)

## Usage

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## API Endpoints

- `GET /health`: Health check endpoint
- `POST /bridge`: Main bridge endpoint for cloud integration

## License

MIT 