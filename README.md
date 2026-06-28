# Pinecone Agentic Search MCP Server
### Node.js · TypeScript · Pinecone · OpenRouter · SSE · Railway

A custom MCP (Model Context Protocol) server that exposes Pinecone
vector search as a standardized tool for AI agents — searching
4,128 embedded ArXiv research papers covering AI Agents, RAG, MCP,
and Prompt Engineering.

Built as the infrastructure layer for
[GenAI Concepts Chat](https://github.com/Paul-Orlando/n8n-mcp-server-agentic-rag),
replacing the original n8n MCP dependency with a custom server that
gives full ownership of the MCP layer with no subscription
dependencies.

---

## 🔗 Live Endpoint

```
https://pinecone-mcp-server-production-189c.up.railway.app/mcp
```

Health check:
```
https://pinecone-mcp-server-production-189c.up.railway.app/health
```

---

## Architecture

```
AI Agent / MCP Client
        │  POST /mcp  (SSE transport)
        ▼
  Express + MCP Server
        │
  ┌─────┴─────────────┐
  │   agentic-search  │
  └─────┬─────────────┘
        │
   OpenRouter (embeddings)    Pinecone (vector search)
   text-embedding-3-small     mcp-server-v1 / arxiv-papers
```

- **Transport:** SSE — legacy MCP transport
- **Health check:** `GET /health` — public, no auth required
- **MCP endpoint:** `POST /mcp`

---

## How It Fits the Portfolio

This server is one of two custom MCP servers in this portfolio:

```
Pinecone Agentic Search MCP Server (this server)
  → SSE transport (legacy MCP pattern)
  → Single tool: agentic-search
  → Searches embedded ArXiv corpus via Pinecone
  → No LLM calls for search — pure vector similarity
  → Called by: GenAI Concepts Chat

Web Research Hub MCP Server
  → Streamable HTTP transport (current MCP spec standard)
  → 4 tools: web_search, fetch_url, calculate, export_report
  → Searches live web via Exa AI
  → Called by: Web Research Hub
```

Having both transport patterns (SSE and Streamable HTTP) in the
same portfolio demonstrates understanding of the MCP protocol
evolution, not just one implementation of it.

---

## What Makes This Different from the Web Research Hub MCP Server

| | This Server | Web Research Hub MCP Server |
|---|---|---|
| Transport | SSE | Streamable HTTP |
| Tools | 1 (`agentic-search`) | 4 (`web_search`, `fetch_url`, `calculate`, `export_report`) |
| Data source | Pinecone vector store (ArXiv corpus) | Live web (Exa AI) + stdlib |
| LLM calls | Yes (OpenRouter for embeddings) | None — pure tool execution |
| Purpose | Academic/research paper search | Web research tool layer |

---

## Tool Reference

### `agentic-search`

Searches the embedded ArXiv research corpus via Pinecone vector
similarity. Accepts a natural language query, embeds it using
OpenAI `text-embedding-3-small` via OpenRouter, and returns the
most relevant excerpts with relevance scores. Use when the query
requires grounded academic or research paper context on AI Agents,
RAG, MCP, or Prompt Engineering topics.

| Parameter | Type | Notes |
|---|---|---|
| `query` | string | Natural language search query |

**Response:** Top-N relevant excerpts with relevance scores from
the 4,128-paper ArXiv corpus.

---

## Authentication

Every request except `GET /health` must include an `X-API-Key`
header:

```
X-API-Key: your-secret-key
```

Missing or invalid keys return HTTP 401:
```json
{
  "error": "Unauthorized.",
  "message": "This is a portfolio demonstration server. To use
  this tool, clone the repo and deploy your own instance with
  your own API keys: github.com/Paul-Orlando/pinecone-mcp-server"
}
```

---

## Rate Limits

`POST /mcp` is limited to **5 requests per IP address per hour**.
Exceeding the limit returns HTTP 429. `GET /health` is not
rate-limited.

Note: one `agentic-search` query may generate multiple internal
`/mcp` requests. This limit allows approximately 3-4 complete
queries per hour.

This is a portfolio demonstration server. To remove these limits,
clone the repo and deploy your own instance with your own API keys.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PINECONE_API_KEY` | ✅ | Pinecone API key |
| `OPENROUTER_API_KEY` | ✅ | OpenRouter API key (used for embeddings) |
| `MCP_API_KEY` | ✅ | Secret key required on all non-health requests |
| `PINECONE_INDEX` | optional | Pinecone index name (default: `mcp-server-v1`) |
| `PINECONE_NAMESPACE` | optional | Pinecone namespace (default: `arxiv-papers`) |
| `PORT` | optional | Server port (default: `3001`) |

Generate a key with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and add your keys:
# PINECONE_API_KEY, OPENROUTER_API_KEY, MCP_API_KEY

# 3. Run locally
npm run dev
```

Verify it's running:
```bash
curl http://localhost:3001/health
```

---

## Deployment

### Railway (recommended)

1. Push this repo to GitHub
2. New Project → Deploy from GitHub repo
3. Add environment variables:
   `PINECONE_API_KEY`, `OPENROUTER_API_KEY`, `MCP_API_KEY`
4. Railway auto-deploys from the Procfile
5. Settings → Networking → Generate Domain
   → Set Target Port to `3001`

---

## Connecting to Claude Desktop

Add this to your `claude_desktop_config.json`:

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

For local development use `http://localhost:3001/mcp`.

---

## Data Source

4,128 ArXiv research papers covering:
- AI Agents
- Retrieval-Augmented Generation (RAG)
- Model Context Protocol (MCP)
- Prompt Engineering

Used for non-commercial demonstration purposes only.
Papers are subject to their respective authors' licenses (CC BY 4.0).

---

## Usage Note

This is a portfolio demonstration server with rate limiting and
API key authentication. For production use, clone the repo and
deploy your own instance with your own API keys — the deployment
instructions above are included for exactly this purpose.

---

## Roadmap

- [ ] Streamable HTTP transport — upgrade from SSE to match
      the current MCP spec standard
- [ ] Expand the corpus — add more research papers beyond
      the current 4,128 ArXiv papers
- [ ] Metadata filtering — filter by publication date,
      author, or topic category
- [ ] Tool call logging for observability

---

## Evolution

This server replaces the n8n MCP server used in the original
GenAI Concepts Chat architecture, giving full ownership of the
MCP layer with no subscription dependencies. The transition from
n8n-hosted MCP to a custom Node.js/TypeScript server is
documented in the
[GenAI Concepts Chat repo](https://github.com/Paul-Orlando/n8n-mcp-server-agentic-rag).

---

## Related Repos

| Repo | Pattern | Stack |
|---|---|---|
| [n8n-mcp-server-agentic-rag](https://github.com/Paul-Orlando/n8n-mcp-server-agentic-rag) | Agentic RAG + MCP Client | Node.js · Express · Pinecone · Gemini Flash 2.5 |
| [web-research-hub-mcp-server](https://github.com/Paul-Orlando/web-research-hub-mcp-server) | Custom MCP Server · Research Tools | FastAPI · FastMCP · Streamable HTTP · Exa AI |
| [web-research-hub](https://github.com/Paul-Orlando/web-research-hub) | Hierarchical 3-Agent Pipeline | Next.js · FastAPI · OpenRouter · Gemini 2.5 Flash |

---

## Author

Paul Orlando
Creative Technologist | AI Agent Developer | Data Analytics
🌐 [paulforlando.com](https://www.paulforlando.com) &nbsp;|&nbsp;
💼 [LinkedIn](https://www.linkedin.com/in/paul-orlando-7841b5154) &nbsp;|&nbsp;
🐙 [GitHub](https://github.com/Paul-Orlando)

---

## License

MIT License
