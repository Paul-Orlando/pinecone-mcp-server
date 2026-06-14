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

- `GET /health` — health check
- `POST /mcp` — MCP endpoint (Streamable HTTP transport)
- `GET /sse` — SSE transport for legacy clients

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
