import express, { Request, Response } from 'express';
import { Config } from '../config/config.js';
import { Logger } from '../utils/logger.js';
import { MCPClientManager } from '../client/mcp-client-manager.js';
import { TunnelManager } from '../utils/tunnel.js';

export class HttpServer {
  private app = express();
  private readonly config: Config;
  private readonly logger: Logger;
  private readonly mcpClient: MCPClientManager;
  private readonly accessToken: string;
  private tunnelManager?: TunnelManager;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config: Config, logger: Logger, mcpClient: MCPClientManager) {
    this.config = config;
    this.logger = logger;
    this.mcpClient = mcpClient;
    
    this.accessToken = process.env.ACCESS_TOKEN || '';
    if (!this.accessToken) {
      this.logger.warn('No ACCESS_TOKEN environment variable set. This is a security risk.');
    }
    
    if (process.argv.includes('--tunnel')) {
      this.tunnelManager = new TunnelManager(logger);
    }
    
    this.setupMiddleware();
    this.setupRoutes();

    this.setupHeartbeat();
  }

  private setupHeartbeat() {
    this.reconnectTimer = setInterval(() => {
      fetch(`http://localhost:${this.config.server.port}/health`)
        .catch(error => {
          this.logger.warn('Health check failed, restarting server...');
          this.start();
        });
    }, 30000); 
  }

  private setupMiddleware(): void {
    // JSON body parser
    this.app.use(express.json());

    // Bearer Token Authentication middleware
    this.app.use((req: Request, res: Response, next) => {
      const authHeader = req.headers.authorization;
      // If no auth header, check if access token is set
      if (this.accessToken) {
        if (!authHeader) {
          res.status(401).json({ error: 'Authorization header is required' });
          return;
        } else {
          // If auth header is set, check if it's a valid Bearer token
          if (authHeader) {
            const [type, token] = authHeader.split(' ');
            if (type !== 'Bearer') {
              res.status(401).json({ error: 'Authorization type must be Bearer' });
              return;
            }

            if (!token || token !== this.accessToken) {
              res.status(401).json({ error: 'Invalid access token' });
              return;
            }
          } else {
            res.status(401).json({ error: 'Access token is required' });
            return;
          }
        }
      }
      next();
    });


    // Error handling middleware
    this.app.use((err: Error, req: Request, res: Response, next: any) => {
      this.logger.error('Server error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok' });
    });

    // Bridge endpoint
    this.app.post('/bridge', async (req: Request, res: Response) => {
      let clientId: string | undefined;
      try {
        const { serverPath, method, params, args, env } = req.body;

        this.logger.info('Bridge request received:', req.body);
        if (!serverPath || !method || !params) {
          res.status(400).json({ 
            error: 'Invalid request body. Required: serverPath, method, params. Optional: args' 
          });
          return;
        }

        // Create a new client for this request with optional args
        clientId = await this.mcpClient.createClient(serverPath, args, env);

        // Execute the request
        const response = await this.mcpClient.executeRequest(clientId, method, params);
        res.json(response);

      } catch (error) {
        this.logger.error('Error processing bridge request:', error);
        res.status(500).json({ error: 'Failed to process request' });
      } finally {
        // Clean up the specific client after use
        if (clientId) {
          await this.mcpClient.closeClient(clientId);
        }
      }
    });
  }

  public async start(): Promise<void> {
    // ASCII art banner
    const banner = `
    ███╗   ███╗ ██████╗██████╗     ██████╗ ██████╗ ██║██████╗  ██████╗ ███████╗
    ████╗ ████║██╔════╝██╔══██╗    ██╔══██╗██╔══██╗██║██╔══██╗██╔════╝ ██╔════╝
    ██╔████╔██║██║     ██████╔╝    ██████╔╝██████╔╝██║██║  ██║██║  ███╗█████╗  
    ██║╚██╔╝██║██║     ██╔═══╝     ██╔══██╗██╔══██╗██║██║  ██║██║   ██║██╔══╝  
    ██║ ╚═╝ ██║╚██████╗██║         ██████╔╝██║  ██║██║██████╔╝╚██████╔╝███████╗
    ╚═╝     ╚═╝ ╚═════╝╚═╝         ╚═════╝ ╚═╝  ╚═╝╚═╝╚═════╝  ╚═════╝ ╚══════╝
    `;
    
    this.app.listen(this.config.server.port, async () => {
      console.log('\x1b[36m%s\x1b[0m', banner);
      const localUrl = `http://localhost:${this.config.server.port}`;
      this.logger.info(`Server listening on port ${this.config.server.port}`);
      this.logger.info(`Local: ${localUrl}`);
      this.logger.info(`Health check URL: ${localUrl}/health`);
      this.logger.info(`MCP Bridge URL: ${localUrl}/bridge`);

      if (this.tunnelManager) {
        this.tunnelManager.createTunnel(this.config.server.port)
          .then(url => {
            if (url) {
              this.logger.info(`Tunnel URL: ${url}`);
              this.logger.info(`MCP Bridge URL: ${url}/bridge`);
            }
          })
          .catch(error => {
            this.logger.error('Failed to create tunnel:', error);
          });
      }
    });
  }

  public async stop(): Promise<void> {
    if (this.tunnelManager) {
      await this.tunnelManager.disconnect();
    }
  }
} 