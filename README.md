# FxKit MCP Server

A Model Context Protocol (MCP) server that provides comprehensive documentation and assistance for the FxKit C# functional programming library.

## Overview

FxKit MCP dynamically fetches and serves documentation from the official [FxKit documentation site](https://taxfyle.github.io/FxKit/), providing AI models with:

- Complete documentation for all FxKit types (Option, Result, Validation, Unit)
- Compiler services documentation (source generators, analyzers)
- Code examples and API references
- Search capabilities across all documentation
- Pre-built prompts for common FxKit patterns

## Features

### Resources
The server exposes FxKit documentation sections as MCP resources:
- `introduction` - FxKit overview and concepts
- `getting-started` - Installation and setup guide
- `option` - Option type documentation
- `result` - Result type documentation  
- `validation` - Validation type documentation
- `unit` - Unit type documentation
- `compiler-overview` - Compiler services overview
- `enum-match` - EnumMatch generator
- `union` - Union type generator
- `lambda` - Lambda generator
- `transformer` - Transformer generator
- `testing` - Testing utilities

### Tools
Interactive tools for querying FxKit documentation:
- `search_documentation` - Search across all documentation
- `get_examples` - Get code examples for specific features
- `list_packages` - List available NuGet packages

### Prompts
Pre-configured prompts for common FxKit patterns:
- `convert-nullable-to-option` - Convert nullable types to Option
- `railway-oriented-programming` - Implement railway-oriented patterns
- `validation-multiple-errors` - Use Validation for error accumulation
- `generate-union-types` - Create union types with source generators

## Installation

### From Source

1. Clone this repository:
```bash
git clone https://github.com/taxfyle/fxkit-mcp.git
cd fxkit-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

### Global Installation

```bash
npm install -g @taxfyle/fxkit-mcp
```

## Usage

### With Claude Code
```json
{
  "mcpServers": {
    "fxkit-docs": {
      "command": "npx",
      "args": [
        "-y",
        "@taxfyle/fxkit-mcp@latest"
      ],
      "env": {}
    }
  }
}
```

### With Claude Desktop

Add the following to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "fxkit-docs": {
      "command": "node",
      "args": ["/path/to/fxkit-mcp/dist/index.js"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "fxkit-docs": {
      "command": "fxkit-mcp"
    }
  }
}
```

### With MCP Inspector

Test the server using the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector tsx src/index.ts
```

### Programmatic Usage

```typescript
import { FxKitMcpServer } from 'fxkit-mcp';

const server = new FxKitMcpServer();
await server.start();
```

## Development

### Running in Development Mode

```bash
npm run dev
```

### Project Structure

```
fxkit-mcp/
├── src/
│   ├── index.ts              # Main entry point
│   ├── server.ts              # MCP server implementation
│   ├── types.ts               # TypeScript type definitions
│   ├── fetcher/
│   │   └── docs-fetcher.ts    # Documentation fetching logic
│   ├── resources/             # Resource handlers (if extended)
│   ├── tools/                 # Tool implementations (if extended)
│   └── prompts/               # Prompt templates (if extended)
├── dist/                      # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

### Testing

The server includes a test mode that verifies all documentation endpoints are accessible:

```bash
npm test
```

## Examples

### Using with an AI Assistant

Once configured, you can ask your AI assistant questions like:

- "Show me the FxKit documentation for the Result type"
- "Search for examples of railway-oriented programming with FxKit"
- "How do I convert nullable types to Option in FxKit?"
- "Generate a union type for payment methods using FxKit"

The AI will use the MCP server to fetch relevant documentation and provide accurate, up-to-date information about FxKit.

## Architecture

The server uses a dynamic fetching approach:

1. **No Static Content**: Documentation is fetched on-demand from the live FxKit documentation site
2. **Caching**: Responses are cached for 5 minutes to improve performance
3. **HTML Parsing**: Uses Cheerio to extract content and code examples from documentation pages
4. **Type Safety**: Full TypeScript implementation with strict typing

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Adding New Documentation Sections

To add new documentation sections:

1. Update the paths array in `src/fetcher/docs-fetcher.ts`
2. Add corresponding resource registration in `src/server.ts`
3. Test that the new section is accessible

### Extending Tools

New tools can be added in `src/server.ts` in the `setupTools()` method. Follow the existing pattern using `registerTool()`.

## License

MIT

## Acknowledgments

- [FxKit](https://github.com/taxfyle/FxKit) - The functional programming library for C#
- [Model Context Protocol](https://modelcontextprotocol.io/) - The protocol specification
- [effect-mcp](https://github.com/niklaserik/effect-mcp) - Inspiration for MCP server structure

## Support

For issues related to:
- FxKit library: Visit the [FxKit GitHub repository](https://github.com/taxfyle/FxKit)
- This MCP server: Open an issue in this repository
- MCP protocol: Check the [MCP documentation](https://modelcontextprotocol.io/)# fxkit-mcp
