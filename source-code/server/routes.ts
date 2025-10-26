import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { wsManager } from "./websocket";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  wsManager.initialize(httpServer);

  return httpServer;
}
