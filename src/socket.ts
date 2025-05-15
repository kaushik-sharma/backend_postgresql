import { Server } from "http";
import { Server as SocketIO } from "socket.io";

import logger from "./utils/logger.js";

export class SocketManager {
  static #io: SocketIO;

  static get io(): SocketIO {
    if (!this.#io) {
      throw new Error(
        "Socket.io not initialized. Call SocketManager.init(server) first."
      );
    }
    return this.#io;
  }

  static readonly init = (server: Server) => {
    this.#io = new SocketIO(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.#io.on("connection", (socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      // Receive data from client
      socket.on("chatMessage", (msg) => {
        logger.info("Received chatMessage:", msg);
      });

      socket.on("disconnect", () => {
        logger.info(`Socket disconnected: ${socket.id}`);
      });
    });
  };
}
