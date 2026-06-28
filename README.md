# Pinecone Agentic Search — MCP Server

A custom MCP (Model Context Protocol) server that exposes Pinecone vector search as a standardized tool for AI agents. Built to replace the n8n MCP dependency in the GenAI Concepts chat app.

## What It Does

Exposes a single tool called `agentic-search` that:
- Accepts a natural language query
- Embeds it using OpenAI text-embedding-3-small via OpenRouter
- Searches the Pinecone knowledge base (4,128 ArXiv research papers)
- Returns the most relevant excerpts with relevance scores

## Architecture

```
AI Agent → MCP Client → This Server → Pinecone (mcp-server-v1) → results
```

## Tools Exposed

| Tool | Description |
|---|---|
| `agentic-search` | Search the GenAI knowledge base covering AI Agents, RAG, MCP, and Prompt Engineering |

## Prerequisites

- Node.js 18+
- OpenRouter API key
- Pinecone API key with index `mcp-server-v1` (namespace: `arxiv-papers`)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env

# 3. Add your keys
PINECONE_API_KEY=your_key
OPENROUTER_API_KEY=your_key
PINECONE_INDEX=mcp-server-v1
PINECONE_NAMESPACE=arxiv-papers
PORT=3001
```

## Run Locally

```bash
npm run dev
```

## Endpoints

- `GET /health` — health check (no auth required)
- `POST /mcp` — MCP endpoint (Streamable HTTP transport)
- `GET /sse` — SSE transport for legacy clients

## Authentication

Every request except `GET /health` must include an `X-API-Key` header:

```
X-API-Key: your-secret-key
```

Missing or invalid keys return HTTP 401.

## Rate Limits

5 requests per IP per hour on all routes except `GET /health`. One `agentic-search` query may generate multiple internal requests. Returns HTTP 429 when exceeded.

## Environment Variables

| Variable | Description |
|---|---|
| `PINECONE_API_KEY` | Pinecone API key |
| `OPENROUTER_API_KEY` | OpenRouter API key (used for embeddings) |
| `PINECONE_INDEX` | Pinecone index name (default: `mcp-server-v1`) |
| `PINECONE_NAMESPACE` | Pinecone namespace (default: `arxiv-papers`) |
| `PORT` | Server port (default: `3001`) |
| `MCP_API_KEY` | Secret key required on all non-health requests |

Generate a key with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## MCP Client Configuration

Example Claude Desktop config with authentication:

```json
{
  "mcpServers": {
    "pinecone-agentic-search": {
      "url": "https://pinecone-mcp-server-production-189c.up.railway.app/mcp",
      "headers": {
        "X-API-Key": "your-secret-key"
      }
    }
  }
}
```

## Usage Note

This is a portfolio demonstration server. For production use, clone the repo and deploy your own instance with your own API keys.

## Deploy to Railway

1. Push to GitHub
2. New Project → Deploy from GitHub
3. Add environment variables
4. Railway auto-deploys

## Data Source

ArXiv research papers covering AI Agents, RAG, MCP, and Prompt Engineering.
Used for non-commercial demonstration purposes only.
Papers are subject to their respective authors' licenses (CC BY 4.0).

## Evolution

This server replaces the n8n MCP server used in the original architecture,
giving full ownership of the MCP layer with no subscription dependencies.
