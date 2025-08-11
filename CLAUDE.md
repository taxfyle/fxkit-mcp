# FxKit MCP Server - AI Assistant Guide

## Project Overview

**fxkit-mcp** is a Model Context Protocol (MCP) server that provides comprehensive documentation and assistance for the FxKit C# functional programming library. It dynamically fetches documentation from the official FxKit documentation site and exposes it through MCP resources, tools, and prompts for AI assistants.

**Technology Stack**: TypeScript, Node.js, MCP SDK, Cheerio for HTML parsing, Zod for validation

## Architecture & Design

### Core Components

1. **Documentation Fetcher** (`src/fetcher/docs-fetcher.ts`)
   - Dynamically fetches content from https://taxfyle.github.io/FxKit/
   - Implements 5-minute TTL cache for performance optimization
   - Extracts and parses HTML content using Cheerio
   - Identifies code examples and formats them for consumption

2. **MCP Server** (`src/server.ts`)
   - **Resources**: 12 documentation sections
     - Introduction, Getting Started
     - Core types: Option, Result, Validation, Unit
     - Compiler services: Overview, EnumMatch, Union, Lambda, Transformer
     - Testing utilities
   - **Tools**: 3 interactive tools
     - `search_documentation`: Full-text search across all docs
     - `get_examples`: Retrieve code examples for specific features
     - `list_packages`: List available NuGet packages
   - **Prompts**: 4 pre-configured patterns
     - Convert nullable to Option
     - Railway-oriented programming
     - Validation for multiple errors
     - Generate union types

3. **Type System** (`src/types.ts`)
   - Strongly typed interfaces for documentation structure
   - Support for code examples, API references, and search results

## Development Workflow

### Initial Setup
```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to JavaScript
```

### Development Commands
```bash
npm run dev          # Run with tsx for hot-reload development
npm run build        # Compile TypeScript (tsc)
npm start            # Run compiled server from dist/
```

### Testing
```bash
# Test with MCP Inspector
npx @modelcontextprotocol/inspector tsx src/index.ts

# Verify build output
npm run build && npm start
```

## Key Files & Their Roles

| File | Purpose | Key Responsibilities |
|------|---------|---------------------|
| `src/index.ts` | Entry point | Server initialization and error handling |
| `src/server.ts` | Core MCP server | Resource/tool/prompt registration, request handling |
| `src/fetcher/docs-fetcher.ts` | Documentation fetcher | HTML fetching, content extraction, caching |
| `src/types.ts` | TypeScript types | Interface definitions for documentation structure |
| `bin.js` | CLI executable | Global package entry point |
| `package.json` | Package config | Dependencies, scripts, metadata |
| `tsconfig.json` | TypeScript config | Compilation settings (ES2022, ESNext modules) |

## Adding New Features

### Add a New Documentation Section

1. Update the paths array in `src/fetcher/docs-fetcher.ts:98-111`
2. Add resource registration in `src/server.ts:24-37`
3. Test the new section:
   ```typescript
   // In src/server.ts setupResources()
   { path: "/new-section", name: "new-section", title: "New Section Title" }
   ```

### Add a New Tool

Add to `setupTools()` method in `src/server.ts:67`:
```typescript
this.server.registerTool(
  "tool_name",
  {
    title: "Tool Title",
    description: "Tool description",
    inputSchema: {
      param: z.string().describe("Parameter description"),
    },
  },
  async ({ param }) => {
    // Tool implementation
    return {
      content: [{
        type: "text",
        text: "Response"
      }]
    };
  }
);
```

### Add a New Prompt

Add to `setupPrompts()` method in `src/server.ts:215`:
```typescript
this.server.registerPrompt(
  "prompt-name",
  {
    title: "Prompt Title",
    description: "Prompt description",
  },
  async () => ({
    messages: [{
      role: "user" as const,
      content: {
        type: "text" as const,
        text: "Prompt template text"
      }
    }]
  })
);
```

## Code Conventions

### Import Style
- **ES Modules**: All imports must use `.js` extension
  ```typescript
  import { DocumentationFetcher } from "./fetcher/docs-fetcher.js";  // ✓ Correct
  import { DocumentationFetcher } from "./fetcher/docs-fetcher";     // ✗ Wrong
  ```

### Async Patterns
- Always use async/await over promises
- Handle errors with try-catch blocks
- Return null for failed operations, not undefined

### TypeScript
- Strict mode enabled
- Explicit return types for public methods
- Interfaces over type aliases for object shapes

### Naming Conventions
- PascalCase: Classes, interfaces, types
- camelCase: Functions, variables, methods
- UPPER_SNAKE_CASE: Constants

## Testing & Quality Assurance

### Current Testing Approach
- No automated tests implemented
- Manual testing via MCP Inspector
- TypeScript strict mode for compile-time safety

### Recommended Testing
```bash
# 1. Test server startup
npm run build && npm start

# 2. Test with MCP Inspector
npx @modelcontextprotocol/inspector tsx src/index.ts

# 3. Verify all documentation paths are accessible
# Check each resource manually through Inspector

# 4. Test cache behavior
# Make multiple requests within 5 minutes to verify caching
```

### Quality Checks
- TypeScript compilation: `npm run build`
- No linting configuration currently
- Consider adding ESLint and Prettier

## Deployment & Integration

### Global Installation
```bash
npm install -g fxkit-mcp
fxkit-mcp  # Run globally
```

### Claude Desktop Integration
Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):
```json
{
  "mcpServers": {
    "fxkit-docs": {
      "command": "node",
      "args": ["/absolute/path/to/fxkit-mcp/dist/index.js"]
    }
  }
}
```

### Claude Code Integration
```json
{
  "mcpServers": {
    "fxkit-docs": {
      "command": "npx",
      "args": ["-y", "fxkit-mcp@latest"],
      "env": {}
    }
  }
}
```

### Zero-Install Usage
```bash
npx fxkit-mcp@latest
```

## Common Tasks & Maintenance

### Update Documentation Base URL
Edit `BASE_URL` in `src/fetcher/docs-fetcher.ts:5`:
```typescript
const BASE_URL = 'https://new-docs-url.com/FxKit';
```

### Clear Documentation Cache
```typescript
// In code that uses DocumentationFetcher
fetcher.clearCache();
```

### Add Support for New FxKit Feature
1. Update `pathMap` in `get_examples` tool (`src/server.ts:118-127`)
2. Add new path to `getAllSections()` (`src/fetcher/docs-fetcher.ts:98-111`)
3. Register as resource if needed

### Debug Documentation Fetching
```typescript
// Add logging to fetchPage() in docs-fetcher.ts
console.error(`Fetching: ${url}`);
console.error(`Cache hit: ${cached !== null}`);
```

### Monitor Cache Performance
```typescript
// In getCached() method
console.log(`Cache stats: ${this.cache.size} entries`);
```

## Gotchas & Important Notes

### Critical Points
1. **ES Module Imports**: MUST use `.js` extension in all imports (TypeScript compiles to ES modules)
2. **Documentation Site Changes**: HTML structure changes on the FxKit docs site may break content extraction
3. **Cache Behavior**: 5-minute TTL means documentation updates won't appear immediately
4. **No File System Access**: All documentation fetched from web, no local file operations
5. **Cheerio Parsing**: Relies on specific HTML selectors (h1, main, article, .content)

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Import errors | Ensure all imports use `.js` extension |
| Empty documentation | Check if FxKit site structure changed |
| Stale content | Clear cache or wait 5 minutes |
| Build failures | Check TypeScript version compatibility |
| MCP connection issues | Verify stdio transport is working |

### Performance Considerations
- Cache reduces network requests significantly
- All documentation paths fetched in parallel for search
- Consider implementing pagination for large result sets
- HTML parsing is synchronous - may block for large pages

### Security Notes
- No authentication required for public documentation
- Input validation via Zod schemas
- No file system writes except cache in memory
- External dependency on FxKit documentation site availability

## Future Improvements

### Suggested Enhancements
1. Add automated tests with Jest or Vitest
2. Implement ESLint and Prettier for code consistency
3. Add GitHub Actions for CI/CD
4. Create Docker image for easier deployment
5. Add telemetry for usage analytics
6. Implement offline mode with bundled docs
7. Add support for versioned documentation
8. Create development documentation generator

### Technical Debt
- No error recovery for network failures
- Cache is in-memory only (lost on restart)
- No request rate limiting
- Missing comprehensive logging
- No health check endpoint