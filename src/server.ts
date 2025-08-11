import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { DocumentationFetcher } from "./fetcher/docs-fetcher.js";
import { DocumentationSection } from "./types.js";

export class FxKitMcpServer {
  private server: McpServer;
  private fetcher: DocumentationFetcher;

  constructor() {
    this.server = new McpServer({
      name: "fxkit-mcp",
      version: "1.0.0",
    });
    this.fetcher = new DocumentationFetcher();
    this.setupResources();
    this.setupTools();
    this.setupPrompts();
  }

  private setupResources(): void {
    // Documentation sections as resources
    const docPaths = [
      { path: "/", name: "introduction", title: "FxKit Introduction" },
      { path: "/getting-started", name: "getting-started", title: "Getting Started with FxKit" },
      { path: "/core/option", name: "option", title: "Option Type Documentation" },
      { path: "/core/result", name: "result", title: "Result Type Documentation" },
      { path: "/core/validation", name: "validation", title: "Validation Type Documentation" },
      { path: "/core/unit", name: "unit", title: "Unit Type Documentation" },
      { path: "/compiler/", name: "compiler-overview", title: "Compiler Services Overview" },
      { path: "/compiler/enum-match", name: "enum-match", title: "EnumMatch Generator" },
      { path: "/compiler/union", name: "union", title: "Union Generator" },
      { path: "/compiler/lambda", name: "lambda", title: "Lambda Generator" },
      { path: "/compiler/transformer", name: "transformer", title: "Transformer Generator" },
      { path: "/testing/", name: "testing", title: "Testing Utilities" },
    ];

    docPaths.forEach(({ path, name, title }) => {
      this.server.registerResource(
        name,
        new ResourceTemplate(`fxkit://${name}`, { list: undefined }),
        {
          title,
          description: `Documentation for ${title}`,
        },
        async (uri) => {
          const doc = await this.fetcher.getDocumentation(path);
          if (!doc) {
            throw new Error(`Failed to fetch documentation for ${path}`);
          }

          const content = [
            {
              uri: uri.href,
              mimeType: "text/markdown",
              text: this.formatDocAsMarkdown(doc),
            },
          ];

          return { contents: content };
        }
      );
    });
  }

  private setupTools(): void {
    // Search documentation tool
    this.server.registerTool(
      "search_documentation",
      {
        title: "Search FxKit Documentation",
        description: "Search across all FxKit documentation for specific topics",
        inputSchema: {
          query: z.string().describe("Search query"),
        },
      },
      async ({ query }) => {
        const results = await this.fetcher.searchDocumentation(query);
        
        if (results.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No documentation found for query: "${query}"`,
              },
            ],
          };
        }

        const formattedResults = results
          .map((doc) => this.formatDocAsMarkdown(doc))
          .join("\n\n---\n\n");

        return {
          content: [
            {
              type: "text",
              text: formattedResults,
            },
          ],
        };
      }
    );

    // Get code examples tool
    this.server.registerTool(
      "get_examples",
      {
        title: "Get FxKit Code Examples",
        description: "Get code examples for specific FxKit features",
        inputSchema: {
          feature: z.string().describe("FxKit feature name (e.g., Option, Result, Validation)"),
        },
      },
      async ({ feature }) => {
        const pathMap: { [key: string]: string } = {
          option: "/core/option",
          result: "/core/result",
          validation: "/core/validation",
          unit: "/core/unit",
          "enum-match": "/compiler/enum-match",
          union: "/compiler/union",
          lambda: "/compiler/lambda",
          transformer: "/compiler/transformer",
        };

        const path = pathMap[feature.toLowerCase()];
        if (!path) {
          return {
            content: [
              {
                type: "text",
                text: `Unknown feature: ${feature}. Available features: ${Object.keys(pathMap).join(", ")}`,
              },
            ],
          };
        }

        const doc = await this.fetcher.getDocumentation(path);
        if (!doc || !doc.examples || doc.examples.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No examples found for ${feature}`,
              },
            ],
          };
        }

        const examplesText = doc.examples
          .map(
            (ex) =>
              `### ${ex.title}\n${ex.description || ""}\n\n\`\`\`${ex.language}\n${ex.code}\n\`\`\``
          )
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: examplesText,
            },
          ],
        };
      }
    );

    // List packages tool
    this.server.registerTool(
      "list_packages",
      {
        title: "List FxKit NuGet Packages",
        description: "List available FxKit NuGet packages with descriptions",
        inputSchema: {},
      },
      async () => {
        const packages = [
          {
            name: "FxKit",
            description: "Core library with Option, Result, Validation, and Unit types",
          },
          {
            name: "FxKit.CompilerServices",
            description: "Roslyn analyzers and source generators for union types, exhaustive matching, and more",
          },
          {
            name: "FxKit.CompilerServices.Annotations",
            description: "Attributes for compiler services functionality",
          },
          {
            name: "FxKit.Testing",
            description: "Testing utilities and helpers for FxKit types",
          },
        ];

        const packagesText = packages
          .map((pkg) => `- **${pkg.name}**: ${pkg.description}`)
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `# FxKit NuGet Packages\n\n${packagesText}\n\n## Installation\n\nInstall via NuGet Package Manager or .NET CLI:\n\n\`\`\`bash\ndotnet add package FxKit\ndotnet add package FxKit.CompilerServices\n\`\`\`\n\n## Recommended Setup\n\nAdd to your global usings:\n\n\`\`\`csharp\nglobal using static FxKit.Prelude;\n\`\`\``,
            },
          ],
        };
      }
    );
  }

  private setupPrompts(): void {
    // Convert nullable to Option prompt
    this.server.registerPrompt(
      "convert-nullable-to-option",
      {
        title: "Convert Nullable to Option",
        description: "Convert C# nullable types to FxKit Option types",
      },
      async () => ({
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Help me convert this nullable type to use FxKit's Option type instead.

Key points:
1. Replace nullable reference types (string?) with Option<string>
2. Use Some(value) for non-null values
3. Use None for null values
4. Use Match() or Map() for pattern matching
5. Chain operations with FlatMap() and Filter()

Example conversion:
From:
\`\`\`csharp
public string? GetUserName(int userId) {
    var user = GetUser(userId);
    return user?.Name;
}
\`\`\`

To:
\`\`\`csharp
public Option<string> GetUserName(int userId) {
    return GetUser(userId)
        .Map(user => user.Name);
}
\`\`\`

What nullable code would you like to convert?`,
            },
          },
        ],
      })
    );

    // Railway-oriented programming prompt
    this.server.registerPrompt(
      "railway-oriented-programming",
      {
        title: "Implement Railway-Oriented Programming",
        description: "Implement railway-oriented programming with FxKit Result types",
      },
      async () => ({
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Let me help you implement railway-oriented programming using FxKit's Result type.

Railway-oriented programming principles:
1. Use Result<T, E> for operations that can fail
2. Chain operations with Map(), FlatMap(), and MapErr()
3. Handle errors explicitly without exceptions
4. Compose functions that return Results

Example workflow:
\`\`\`csharp
public Result<Order, string> ProcessOrder(OrderRequest request) =>
    ValidateRequest(request)
        .FlatMap(validated => CreateOrder(validated))
        .FlatMap(order => ChargePayment(order))
        .Map(charged => SendConfirmation(charged))
        .MapErr(error => $"Order processing failed: {error}");

private Result<OrderRequest, string> ValidateRequest(OrderRequest request) =>
    string.IsNullOrEmpty(request.CustomerEmail)
        ? Err("Customer email is required")
        : Ok(request);
\`\`\`

What operation would you like to implement using railway-oriented programming?`,
            },
          },
        ],
      })
    );

    // Validation for multiple errors prompt
    this.server.registerPrompt(
      "validation-multiple-errors",
      {
        title: "Use Validation for Multiple Errors",
        description: "Collect multiple validation errors using FxKit Validation type",
      },
      async () => ({
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Let me help you use FxKit's Validation type to collect multiple validation errors.

Validation type benefits:
1. Accumulates all errors instead of failing on first error
2. Combines validations using Apply() and Zip()
3. Supports both success and failure paths
4. Perfect for form validation and data verification

Example validation:
\`\`\`csharp
public Validation<User, List<string>> ValidateUser(UserInput input) {
    var nameValidation = ValidateName(input.Name);
    var emailValidation = ValidateEmail(input.Email);
    var ageValidation = ValidateAge(input.Age);

    return nameValidation
        .Zip(emailValidation, ageValidation)
        .Map((name, email, age) => new User(name, email, age));
}

private Validation<string, List<string>> ValidateName(string name) =>
    string.IsNullOrWhiteSpace(name)
        ? Invalid(new List<string> { "Name is required" })
        : Valid(name);
\`\`\`

What validation scenario would you like to implement?`,
            },
          },
        ],
      })
    );

    // Union types with analyzers prompt
    this.server.registerPrompt(
      "generate-union-types",
      {
        title: "Generate Union Types with Analyzers",
        description: "Create discriminated unions using FxKit source generators",
      },
      async () => ({
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Let me help you create union types using FxKit's source generators.

Union type features:
1. Automatic generation with [Union] attribute
2. Exhaustive pattern matching with Match()
3. Type-safe discriminated unions
4. Compiler-enforced completeness

Example union:
\`\`\`csharp
[Union]
public partial record PaymentMethod
{
    partial record CreditCard(string Number, string Cvv);
    partial record PayPal(string Email);
    partial record BankTransfer(string AccountNumber, string RoutingNumber);
}

// Usage with exhaustive matching
public string ProcessPayment(PaymentMethod method) =>
    method.Match(
        creditCard => $"Processing credit card ending in {creditCard.Number[^4..]}",
        payPal => $"Processing PayPal payment for {payPal.Email}",
        bankTransfer => $"Processing bank transfer from account {bankTransfer.AccountNumber}"
    );
\`\`\`

What union type would you like to create?`,
            },
          },
        ],
      })
    );
  }

  private formatDocAsMarkdown(doc: DocumentationSection): string {
    let markdown = `# ${doc.title}\n\n`;
    markdown += `Source: ${doc.url}\n\n`;
    
    if (doc.content) {
      markdown += `${doc.content}\n\n`;
    }

    if (doc.examples && doc.examples.length > 0) {
      markdown += "## Examples\n\n";
      doc.examples.forEach((ex) => {
        markdown += `### ${ex.title}\n`;
        if (ex.description) {
          markdown += `${ex.description}\n\n`;
        }
        markdown += `\`\`\`${ex.language}\n${ex.code}\n\`\`\`\n\n`;
      });
    }

    return markdown;
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("FxKit MCP Server started");
  }
}