import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";

dotenv.config();

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const PINECONE_INDEX = process.env.PINECONE_INDEX || "mcp-server-v1";
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || "arxiv-papers";
const PORT = parseInt(process.env.PORT || "3001");

// ── Pinecone client ───────────────────────────────────────────────────────────
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });

// ── Embed a query using OpenRouter ────────────────────────────────────────────
async function embedQuery(text: string): Promise<number[]> {
  const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/text-embedding-3-small",
      input: text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embedding failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { data: { embedding: number[] }[] };
  return data.data[0].embedding;
}

// ── Search Pinecone ───────────────────────────────────────────────────────────
async function searchPinecone(query: string, topK = 5): Promise<string> {
  const vector = await embedQuery(query);
  const index = pinecone.index(PINECONE_INDEX).namespace(PINECONE_NAMESPACE);

  const results = await index.query({
    vector,
    topK,
    includeMetadata: true,
  });

  if (!results.matches || results.matches.length === 0) {
    return "No relevant content found in the knowledge base.";
  }

  return results.matches
    .map((m, i) => {
      const text = (m.metadata?.text as string) || (m.metadata?.content as string) || "";
      const source = (m.metadata?.source as string) || (m.metadata?.filename as string) || "arxiv";
      const score = m.score?.toFixed(3) || "n/a";
      return `[${i + 1}] Source: ${source} (relevance: ${score})\n${text}`;
    })
    .join("\n\n---\n\n");
}

// ── Create a fresh MCP server instance per request ───────────────────────────
function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "pinecone-agentic-search",
    version: "1.0.0",
  });

  server.tool(
    "agentic-search",
    "Search the GenAI knowledge base covering AI Agents, RAG, MCP, and Prompt Engineering. Returns relevant excerpts from ArXiv research papers.",
    {
      query: z.string().describe("The search query to find relevant content"),
      topK: z.number().optional().describe("Number of results to return (default: 5)"),
    },
    async ({ query, topK = 5 }) => {
      try {
        const results = await searchPinecone(query, topK);
        return {
          content: [{ type: "text", text: results }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return {
          content: [{ type: "text", text: `Search failed: ${message}` }],
          isError: true,
        };
      }
    }
  );

  return server;
}

// ── Rate limiter ──────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: "Rate limit exceeded.",
      message:
        "This is a portfolio demonstration server limited to 10 requests per hour. Clone the repo and deploy your own instance: github.com/Paul-Orlando/pinecone-mcp-server",
    });
  },
});

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers["x-api-key"];
  if (!key || key !== process.env.MCP_API_KEY) {
    res.status(401).json({
      error: "Unauthorized.",
      message:
        "This is a portfolio demonstration server. To use this tool, clone the repo and deploy your own instance with your own API keys: github.com/Paul-Orlando/pinecone-mcp-server",
    });
    return;
  }
  next();
}

// ── MCP handler (shared between /mcp and /sse) ────────────────────────────────
async function handleMcp(req: Request, res: Response): Promise<void> {
  try {
    const mcpServer = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error("MCP request error:", err);
    if (!res.headersSent) {
      res.status(500).send("Internal server error");
    }
  }
}

// ── Express app ───────────────────────────────────────────────────────────────
const app = express();
app.set('trust proxy', 1);

// Health check — no rate limit, no auth
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    server: "pinecone-agentic-search",
    index: PINECONE_INDEX,
    namespace: PINECONE_NAMESPACE,
  });
});

// All other routes: rate limit → auth → handler
app.use(limiter);
app.use(requireApiKey);

app.all("/mcp", handleMcp);
app.all("/sse", handleMcp);

app.use((_req, res) => {
  res.status(404).send("Not found");
});

app.listen(PORT, () => {
  console.log(`\n🚀 Pinecone MCP Server running at http://localhost:${PORT}`);
  console.log(`📚 Index: ${PINECONE_INDEX} / Namespace: ${PINECONE_NAMESPACE}`);
  console.log(`🔌 MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health\n`);
});