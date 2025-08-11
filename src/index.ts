#!/usr/bin/env node

import { FxKitMcpServer } from './server.js';

async function main() {
  try {
    const server = new FxKitMcpServer();
    await server.start();
  } catch (error) {
    console.error('Failed to start FxKit MCP Server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});