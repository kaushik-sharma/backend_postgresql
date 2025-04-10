import { Server } from "http";
import { Server as SocketIO } from "socket.io";

export default class SocketManager {
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
      console.log(`Socket connected: ${socket.id}`);

      // Receive data from client
      socket.on("chatMessage", (msg) => {
        console.log("Received chatMessage:", msg);
      });

      socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  };
}
