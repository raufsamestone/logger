#!/usr/bin/env bun

import React, { useState, useEffect } from "react";
import { render, Text, Box, useInput, useApp } from "ink";
import { program } from "commander";
import chalk from "chalk";
import { exportLogs } from "./export";

const API_BASE_URL = "http://localhost:3000";

interface Log {
  id: number;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

// New Log Component
function NewLogComponent() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [currentField, setCurrentField] = useState<"title" | "content" | "tags">("title");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const { exit } = useApp();

  useInput(async (input, key) => {
    if (isSubmitting) return;

    if (key.ctrl && input === "c") {
      exit();
      return;
    }

    if (key.return) {
      if (currentField === "title" && title.trim()) {
        setCurrentField("content");
      } else if (currentField === "content" && content.trim()) {
        setCurrentField("tags");
      } else if (currentField === "tags") {
        // Submit the log
        setIsSubmitting(true);
        try {
          const tagsArray = tags.trim() ? tags.split(",").map(tag => tag.trim()).filter(Boolean) : [];
          
          const response = await fetch(`${API_BASE_URL}/logs`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: title.trim(),
              content: content.trim(),
              tags: tagsArray,
            }),
          });

          const result = await response.json();

          if (result.success) {
            setMessage("✅ Log created successfully!");
            setTimeout(() => exit(), 1000);
          } else {
            setMessage(`❌ Error: ${result.error}`);
            setIsSubmitting(false);
          }
        } catch (error) {
          setMessage(`❌ Connection error: ${error instanceof Error ? error.message : "Unknown error"}`);
          setIsSubmitting(false);
        }
      }
    } else if (key.backspace || key.delete) {
      if (currentField === "title") {
        setTitle(prev => prev.slice(0, -1));
      } else if (currentField === "content") {
        setContent(prev => prev.slice(0, -1));
      } else if (currentField === "tags") {
        setTags(prev => prev.slice(0, -1));
      }
    } else if (input && !key.ctrl && !key.meta) {
      if (currentField === "title") {
        setTitle(prev => prev + input);
      } else if (currentField === "content") {
        setContent(prev => prev + input);
      } else if (currentField === "tags") {
        setTags(prev => prev + input);
      }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>Create New Log</Text>
      <Text color="gray">Press Ctrl+C to cancel</Text>
      <Text> </Text>
      
      <Box>
        <Text color={currentField === "title" ? "yellow" : "white"}>
          Title: {title}
          {currentField === "title" && <Text color="yellow">_</Text>}
        </Text>
      </Box>
      
      <Box>
        <Text color={currentField === "content" ? "yellow" : "white"}>
          Content: {content}
          {currentField === "content" && <Text color="yellow">_</Text>}
        </Text>
      </Box>
      
      <Box>
        <Text color={currentField === "tags" ? "yellow" : "white"}>
          Tags (comma-separated): {tags}
          {currentField === "tags" && <Text color="yellow">_</Text>}
        </Text>
      </Box>

      <Text> </Text>
      
      {currentField === "title" && (
        <Text color="gray">Enter a title for your log, then press Enter</Text>
      )}
      {currentField === "content" && (
        <Text color="gray">Enter the content of your log, then press Enter</Text>
      )}
      {currentField === "tags" && (
        <Text color="gray">Enter tags separated by commas (optional), then press Enter to save</Text>
      )}

      {isSubmitting && <Text color="blue">Saving log...</Text>}
      {message && <Text>{message}</Text>}
    </Box>
  );
}

// List Logs Component
function ListLogsComponent({ searchTerm }: { searchTerm?: string }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { exit } = useApp();

  useEffect(() => {
    fetchLogs();
  }, []);

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
    }
  });

  const fetchLogs = async () => {
    try {
      const url = searchTerm 
        ? `${API_BASE_URL}/logs?search=${encodeURIComponent(searchTerm)}`
        : `${API_BASE_URL}/logs`;
      
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setLogs(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(`Connection error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box padding={1}>
        <Text color="blue">Loading logs...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={1}>
        <Text color="red">❌ {error}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>
        {searchTerm ? `Search Results for "${searchTerm}"` : "All Logs"} ({logs.length})
      </Text>
      <Text color="gray">Press Ctrl+C to exit</Text>
      <Text> </Text>

      {logs.length === 0 ? (
        <Text color="yellow">No logs found.</Text>
      ) : (
        logs.map((log, index) => (
          <Box key={log.id} flexDirection="column" marginBottom={1}>
            <Text color="green" bold>
              #{log.id} {log.title}
            </Text>
            <Text wrap="wrap">
              {log.content.length > 100 
                ? log.content.substring(0, 100) + "..."
                : log.content}
            </Text>
            {log.tags.length > 0 && (
              <Text color="blue">
                Tags: {log.tags.join(", ")}
              </Text>
            )}
            <Text color="gray">
              Created: {new Date(log.createdAt).toLocaleString()}
            </Text>
            {index < logs.length - 1 && <Text color="gray">{"─".repeat(50)}</Text>}
          </Box>
        ))
      )}
    </Box>
  );
}

// CLI Program
program
  .name("log")
  .description("Terminal-based logging application")
  .version("1.0.0");

program
  .command("new")
  .description("Create a new log entry")
  .action(() => {
    render(<NewLogComponent />);
  });

program
  .command("list")
  .description("List all log entries")
  .option("-s, --search <term>", "Search logs by keyword")
  .action((options) => {
    render(<ListLogsComponent searchTerm={options.search} />);
  });

program
  .command("export")
  .description("Export all logs to a Markdown file")
  .option("-f, --file <filename>", "Output filename", "export.md")
  .action(async (options) => {
    await exportLogs(options.file);
  });

// Show help if no command is provided
if (process.argv.length === 2) {
  program.help();
}

program.parse();