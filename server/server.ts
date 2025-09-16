import { Elysia, t } from "elysia";
import { db, initializeDatabase } from "./db";
import { logs, type NewLog } from "./schema";
import { eq, like, or } from "drizzle-orm";

// Initialize database
initializeDatabase();

const app = new Elysia()
  .get("/", () => "Terminal Logger API Server")
  
  // Create a new log
  .post(
    "/logs",
    async ({ body }) => {
      try {
        const newLog: NewLog = {
          title: body.title,
          createdAt: new Date().toISOString(),
        };

        const result = await db.insert(logs).values(newLog).returning();
        return {
          success: true,
          data: result[0],
          message: "Log created successfully",
        };
      } catch (error) {
        console.error("Error creating log:", error);
        return {
          success: false,
          error: "Failed to create log",
        };
      }
    },
    {
      body: t.Object({
        title: t.String(),
      }),
    }
  )

  // Get all logs or search logs
  .get("/logs", async ({ query }) => {
    try {
      let result;

      if (query.search) {
        // Search in title only
        const searchTerm = `%${query.search}%`;
        result = await db
          .select()
          .from(logs)
          .where(like(logs.title, searchTerm))
          .orderBy(logs.createdAt);
      } else {
        // Get all logs
        result = await db.select().from(logs).orderBy(logs.createdAt);
      }

      return {
        success: true,
        data: result,
        count: result.length,
      };
    } catch (error) {
      console.error("Error fetching logs:", error);
      return {
        success: false,
        error: "Failed to fetch logs",
      };
    }
  })

  // Get a single log by ID
  .get("/logs/:id", async ({ params }) => {
    try {
      const result = await db
        .select()
        .from(logs)
        .where(eq(logs.id, parseInt(params.id)))
        .limit(1);

      if (result.length === 0) {
        return {
          success: false,
          error: "Log not found",
        };
      }

      return {
        success: true,
        data: result[0],
      };
    } catch (error) {
      console.error("Error fetching log:", error);
      return {
        success: false,
        error: "Failed to fetch log",
      };
    }
  })

  // Update a log
  .put("/logs/:id", async ({ params, body }) => {
    try {
      const result = await db
        .update(logs)
        .set({
          title: body.title,
        })
        .where(eq(logs.id, parseInt(params.id)))
        .returning();

      if (result.length === 0) {
        return {
          success: false,
          error: "Log not found",
        };
      }

      return {
        success: true,
        message: "Log updated successfully",
        data: result[0],
      };
    } catch (error) {
      console.error("Error updating log:", error);
      return {
        success: false,
        error: "Failed to update log",
      };
    }
  })

  // Delete a log
  .delete("/logs/:id", async ({ params }) => {
    try {
      const result = await db
        .delete(logs)
        .where(eq(logs.id, parseInt(params.id)))
        .returning();

      if (result.length === 0) {
        return {
          success: false,
          error: "Log not found",
        };
      }

      return {
        success: true,
        message: "Log deleted successfully",
        data: result[0],
      };
    } catch (error) {
      console.error("Error deleting log:", error);
      return {
        success: false,
        error: "Failed to delete log",
      };
    }
  })

  .listen(3000);

console.log(`Server is running at http://localhost:${app.server?.port}`);

export type App = typeof app;