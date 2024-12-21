# MCP Bridge

    ███╗   ███╗ ██████╗██████╗     ██████╗ ██████╗ ██║██████╗  ██████╗ ███████╗
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
   ```bash
   git clone https://github.com/modelcontextprotocol/mcp-bridge.git
   ```
   and enter the directory
   ```bash
   cd mcp-bridge
   ```
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

## API Endpoints

After the bridge is running, there are two endpoints exposed:

- `GET /health`: Health check endpoint
- `POST /bridge`: Main bridge endpoint for receiving requests from the cloud

For example, the following is a configuration of the official [Github MCP](https://github.com/modelcontextprotocol/servers/tree/main/src/github):

```json
{
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-github"
  ],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "<your_github_personal_access_token>"
  }
}
```

You can send a request to the bridge as the following to list the tools of the MCP server and call a specific tool.

**Listing tools:**

```bash
curl -X POST http://localhost:3000/bridge \
     -d '{
       "method": "tools/list",
       "serverPath": "npx",
       "args": [
         "-y",
         "@modelcontextprotocol/server-github"
       ],
       "params": {},
       "env": {
         "GITHUB_PERSONAL_ACCESS_TOKEN": "<your_github_personal_access_token>"
       }
     }'
```

**Calling a tool:**

Using the search_repositories tool to search for repositories related to modelcontextprotocol

```bash
curl -X POST http://localhost:3000/bridge \
     -d '{
       "method": "tools/call",
       "serverPath": "npx",
       "args": [
         "-y",
         "@modelcontextprotocol/server-github"
       ],
       "params": {
         "name": "search_repositories",
         "arguments": {
            "query": "modelcontextprotocol"
         },
       },
       "env": {
         "GITHUB_PERSONAL_ACCESS_TOKEN": "<your_github_personal_access_token>"
       }
     }'
```

## Authentication

The bridge uses a simple token-based authentication system. The token is stored in the `.env` file. If the token is set, the bridge will use it to authenticate the request.

Sample request with token:

```bash
curl -X POST http://localhost:3000/bridge \
     -H "Authorization: Bearer <your_auth_token>" \
     -d '{
       "method": "tools/list",
       "serverPath": "npx",
       "args": [
         "-y",
         "@modelcontextprotocol/server-github"
       ],
       "params": {},
       "env": {
         "GITHUB_PERSONAL_ACCESS_TOKEN": "<your_github_personal_access_token>"
       }
     }'
```

## Configuration

Required environment variables:

- `AUTH_TOKEN`: Authentication token for the bridge API (Optional)
- `PORT`: HTTP server port (default: 3000, required)
- `LOG_LEVEL`: Logging level (default: info, required)

## License

MIT 