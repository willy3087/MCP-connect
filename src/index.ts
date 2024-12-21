import { HttpServer } from './server/http-server.js';
import { MCPClientManager } from './client/mcp-client-manager.js';
import { Config, loadConfig } from './config/config.js';
import { Logger, createLogger } from './utils/logger.js';

async function main() {
  const config =  loadConfig();
  const logger = createLogger(config);
  const mcpClient = new MCPClientManager(logger);
  const server = new HttpServer(config, logger, mcpClient);

  // Handle process termination
  async function shutdown() {
    logger.info('Shutting down...');
    try {
      await mcpClient.stop();
    } catch (error) {
      logger.error('Error during shutdown:', error);
    } finally {
      process.exit(0);
    }
  }

  // Handle different termination signals
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  process.on('uncaughtException', async (error) => {
    logger.error('Uncaught exception:', error);
    await shutdown();
  });
  process.on('unhandledRejection', async (error) => {
    logger.error('Unhandled rejection:', error);
    await shutdown();
  });

  // Start the server
  server.start();
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});