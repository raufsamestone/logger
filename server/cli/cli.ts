#!/usr/bin/env bun

import { program } from "commander";
import chalk from "chalk";
import { exportLogs } from "./export";

const API_BASE_URL = "http://localhost:3000";

interface Log {
  id: number;
  title: string;
  createdAt: string;
}

// Simple readline-based input
async function askQuestion(question: string): Promise<string> {
  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Format date for Istanbul timezone
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Create new log
async function createNewLog(logText?: string) {
  try {
    let title: string;
    
    if (logText) {
      // Direct input from command line
      title = logText;
    } else {
      // Interactive input
      console.log(chalk.blue.bold("\nCreate New Log"));
      console.log(chalk.gray("Press Ctrl+C to cancel\n"));
      title = await askQuestion(chalk.yellow("Log: "));
    }
    
    if (!title.trim()) {
      console.log(chalk.red("Log is required!"));
      return;
    }

    if (!logText) {
      console.log(chalk.blue("\nSaving log..."));
    }
    
    const response = await fetch(`${API_BASE_URL}/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title.trim(),
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(chalk.green(`✅ Log created successfully! (ID: ${result.data.id})`));
    } else {
      console.log(chalk.red("❌ Failed to create log"));
    }
  } catch (error) {
    console.log(chalk.red("❌ Error creating log:") + " " + error);
  }
}

// List logs
async function listLogs(options: { limit?: string; search?: string }) {
  try {
    let url = `${API_BASE_URL}/logs`;
    const params = new URLSearchParams();
    
    if (options.limit) {
      params.append("limit", options.limit);
    }
    if (options.search) {
      params.append("search", options.search);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      console.log(chalk.red("❌ Failed to fetch logs"));
      return;
    }

    const result = await response.json();
    const logs: Log[] = result.data || [];
    
    if (logs.length === 0) {
      console.log(chalk.yellow("No logs found."));
      return;
    }

    console.log(chalk.blue.bold(`\n Found ${logs.length} log(s):\n`));
    
    logs.forEach((log) => {
      const date = formatDate(log.createdAt);
      
      console.log(chalk.cyan(`#${log.id} ${log.title}`));
      console.log(chalk.gray(`   ${date}\n`));
    });
  } catch (error) {
    console.log(chalk.red("❌ Error fetching logs:") + " " + error);
  }
}

// Enter/View a specific log
async function enterLog(options: { id?: string }) {
  if (!options.id) {
    console.log(chalk.red("❌ Please provide a log ID using --id"));
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/logs/${options.id}`);
    if (!response.ok) {
      if (response.status === 404) {
        console.log(chalk.red("❌ Log not found"));
      } else {
        console.log(chalk.red("❌ Failed to fetch log"));
      }
      return;
    }

    const result = await response.json();
    
    if (!result.success) {
      console.log(chalk.red(`❌ ${result.error}`));
      return;
    }
    
    const log: Log = result.data;
    
    console.log(chalk.blue.bold(`\n📖 Log #${log.id}: ${log.title}\n`));
    
    const date = formatDate(log.createdAt);
    console.log(chalk.gray(`Created: ${date}\n`));
    
    // Show options
    console.log(chalk.yellow("Options:"));
    console.log(chalk.gray("  - Press 'd' to delete this log"));
    console.log(chalk.gray("  - Press 'e' to edit this log"));
    console.log(chalk.gray("  - Press 'q' to quit"));
    
    const action = await askQuestion(chalk.blue("\nAction (d/e/q): "));
    
    switch (action.toLowerCase()) {
      case 'd':
        await deleteLog({ id: options.id });
        break;
      case 'e':
        await editLog({ id: options.id });
        break;
      case 'q':
        console.log(chalk.gray("Goodbye!"));
        break;
      default:
        console.log(chalk.yellow("Invalid option"));
    }
  } catch (error) {
    console.log(chalk.red("❌ Error fetching log:") + " " + error);
  }
}

// Delete a log
async function deleteLog(options: { id?: string }) {
  if (!options.id) {
    console.log(chalk.red("❌ Please provide a log ID using --id"));
    return;
  }

  try {
    const confirm = await askQuestion(chalk.red(`Are you sure you want to delete log #${options.id}? (y/N): `));
    
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log(chalk.yellow("Deletion cancelled"));
      return;
    }

    const response = await fetch(`${API_BASE_URL}/logs/${options.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      console.log(chalk.green(`✅ Log #${options.id} deleted successfully`));
    } else if (response.status === 404) {
      console.log(chalk.red("❌ Log not found"));
    } else {
      console.log(chalk.red("❌ Failed to delete log"));
    }
  } catch (error) {
    console.log(chalk.red("❌ Error deleting log:") + " " + error);
  }
}

// Edit a log
async function editLog(options: { id?: string }) {
  if (!options.id) {
    console.log(chalk.red("❌ Please provide a log ID using --id"));
    return;
  }

  try {
    // First, get the current log
    const getResponse = await fetch(`${API_BASE_URL}/logs/${options.id}`);
    if (!getResponse.ok) {
      console.log(chalk.red("❌ Log not found"));
      return;
    }

    const getResult = await getResponse.json();
    const currentLog: Log = getResult.data;
    
    console.log(chalk.blue.bold(`\n✏️  Edit Log #${options.id}\n`));
    console.log(chalk.gray("Press Enter to keep current value\n"));

    const newTitle = await askQuestion(chalk.yellow(`Log [${currentLog.title}]: `));

    const title = newTitle.trim() || currentLog.title;

    console.log(chalk.blue("\nUpdating log..."));
    
    const response = await fetch(`${API_BASE_URL}/logs/${options.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title.trim(),
      }),
    });

    if (response.ok) {
      console.log(chalk.green(`✅ Log #${options.id} updated successfully`));
    } else {
      console.log(chalk.red("❌ Failed to update log"));
    }
  } catch (error) {
    console.log(chalk.red("❌ Error updating log:") + " " + error);
  }
}

// Export logs
async function exportLogsCommand(options: { output?: string; format?: string }) {
  try {
    const response = await fetch(`${API_BASE_URL}/logs`);
    if (!response.ok) {
      console.log(chalk.red("❌ Failed to fetch logs"));
      return;
    }

    const result = await response.json();
    const logs: Log[] = result.data || [];
    const outputFile = options.output || "logs.md";
    const format = options.format || "markdown";

    await exportLogs(outputFile);
    console.log(chalk.green(`✅ Logs exported to ${outputFile}`));
  } catch (error) {
    console.log(chalk.red("❌ Error exporting logs:") + " " + error);
  }
}

// Main CLI setup
program
  .name("log")
  .description("Terminal-based logging application")
  .version("1.0.0")
  .argument("[id]", "Log ID to view")
  .action((id) => {
    if (id) {
      enterLog({ id });
    } else {
      listLogs({});
    }
  });

program
  .command("new [logText]")
  .description("Create a new log entry")
  .action((logText) => createNewLog(logText));

program
  .command("list")
  .description("List all log entries")
  .option("-l, --limit <number>", "Limit number of logs to display")
  .option("-s, --search <term>", "Search logs by title or content")
  .action(listLogs);

program
  .command("delete <id>")
  .description("Delete a log by ID")
  .action((id) => deleteLog({ id }));

program
  .command("edit <id>")
  .description("Edit a log by ID")
  .action((id) => editLog({ id }));

program
  .command("export")
  .description("Export all logs to a file")
  .option("-o, --output <file>", "Output file name", "logs.md")
  .option("-f, --format <format>", "Export format", "markdown")
  .action(exportLogsCommand);

program.parse();
