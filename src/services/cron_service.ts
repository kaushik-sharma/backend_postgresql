import cron from "node-cron";

import { deleteScheduledUserAccounts } from "../helpers/cron_functions.js";
import logger from "../utils/logger.js";

export default class CronService {
  static readonly scheduleDailyEmails = () => {
    // Send regular notifications/emails. Runs at 10 AM everyday.
    cron.schedule("0 10 * * *", () => {
      logger.info(`Sending emails at: ${new Date().toLocaleString()}`);
      // Send notifications / emails
      logger.info("Emails successfully sent.");
    });
  };

  static readonly scheduleRequestedUserDeletions = () => {
    // Delete due user accounts. Runs every hour.
    cron.schedule("0 * * * *", async () => {
      logger.info("Starting scheduled user account deletion task.");
      await deleteScheduledUserAccounts();
      logger.info("Completed scheduled user account deletion task.");
    });
  };
}
