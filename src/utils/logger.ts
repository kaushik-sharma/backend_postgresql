import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: "debug",
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      const output =
        typeof message === "object"
          ? JSON.stringify(message, null, 2)
          : message;
      return `${timestamp} [${level.toUpperCase()}]: ${output}`;
    })
  ),
  transports: [new transports.Console()],
});

export default logger;
