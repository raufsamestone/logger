# Logger

A simple terminal-based logging tool for quick log entries.

[![Built with Bun](https://img.shields.io/badge/Built%20with-Bun.js-000000?style=flat&logo=bun)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=flat&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

![Demo](./demo.mp4)

## Quick Start

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Start the server:**
   ```bash
   bun run server
   ```

3. **Use the CLI:**
   ```bash
   # Create a new log
   bun run cli new
   
   # List all logs
   bun run cli list
   
   # Search logs
   bun run cli list --search "keyword"
   
   # Export to markdown
   bun run cli export
   ```

## Installation

```bash
# Install globally
bun install -g

# Or use directly
bun run cli new "my log message"
```

## Stack

- **Runtime**: Bun.js
- **Backend**: Elysia
- **Database**: SQLite + Drizzle ORM
- **CLI**: Ink (React-based TUI)

## API

- `POST /logs` - Create log
- `GET /logs` - List logs
- `GET /logs?search=term` - Search logs
- `DELETE /logs/:id` - Delete log

## Development

```bash
bun run dev    # Start server with watch mode
bun run server # Start server
bun run cli    # Run CLI
```