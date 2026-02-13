import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { 
  authModule, 
  organizationsModule, 
  financialLogsModule, 
  dashboardModule,
  usersModule 
} from "./modules";
import { logger, log } from "./lib/logger";
import { swaggerConfig } from "./lib/swagger";

const app = new Elysia()
  // Logger middleware (must be first)
  .use(logger)
  
  // Swagger documentation
  .use(swaggerConfig)
  
  // CORS
  .use(cors({
    origin: true,
    credentials: true,
  }))

  // Health check & info
  .get("/", () => ({
    name: "UCH Connection API",
    version: "1.0.0",
    description: "Digital Financial Ledger System",
    status: "running",
    timestamp: new Date().toISOString(),
    documentation: "/docs",
  }), {
    detail: {
      tags: ["Health"],
      summary: "API Info",
      description: "Get API information and status",
    },
  })

  .get("/health", () => ({ 
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }), {
    detail: {
      tags: ["Health"],
      summary: "Health Check",
      description: "Check if API is running",
    },
  })

  // API routes with prefix
  .group("/api", (app) =>
    app
      .use(authModule)
      .use(organizationsModule)
      .use(financialLogsModule)
      .use(dashboardModule)
      .use(usersModule)
  )

  // Global error handler
  .onError(({ error, code, set }) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error(`[${code}] ${errorMessage}`);

    if (code === "VALIDATION") {
      set.status = 400;
      return {
        success: false,
        error: "Validation error",
        details: String(error),
      };
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        success: false,
        error: "Endpoint not found",
      };
    }

    if (code === "PARSE") {
      set.status = 400;
      return {
        success: false,
        error: "Invalid request body",
      };
    }

    set.status = 500;
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    };
  })

  .listen(process.env.PORT || 4000);

// Startup logs
log.success("Server started successfully");
log.info(`📍 Local:    http://localhost:${app.server?.port}`);
log.info(`📚 Docs:     http://localhost:${app.server?.port}/docs`);
log.info(`🌍 Env:      ${process.env.NODE_ENV || "development"}`);
console.log("");

export type App = typeof app;
