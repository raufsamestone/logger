import { writeFileSync } from "fs";

interface Log {
  id: number;
  title: string;
  createdAt: string;
}

const API_BASE_URL = "http://localhost:3000";

export async function exportLogs(filename: string = "export.md"): Promise<void> {
  try {
    console.log("Fetching logs from server...");
    
    const response = await fetch(`${API_BASE_URL}/logs`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch logs");
    }

    const logs: Log[] = result.data;

    if (logs.length === 0) {
      console.log("No logs found to export.");
      return;
    }

    console.log(`Exporting ${logs.length} logs...`);

    // Generate markdown content
    let markdownContent = `# Exported Logs\n\n`;
    markdownContent += `Total logs: ${logs.length}\n`;
    markdownContent += `Exported on: ${new Date().toISOString()}\n\n`;
    markdownContent += `---\n\n`;

    for (const log of logs) {
      const date = new Date(log.createdAt).toLocaleString('tr-TR', {
        timeZone: 'Europe/Istanbul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      markdownContent += `## #${log.id} ${log.title}\n\n`;
      markdownContent += `**Created:** ${date}\n\n`;
      markdownContent += `---\n\n`;
    }

    // Write to file
    writeFileSync(filename, markdownContent, "utf8");
    
    console.log(`✅ Successfully exported ${logs.length} logs to ${filename}`);
  } catch (error) {
    console.error("❌ Export failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}