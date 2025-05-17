import cron from "node-cron";

import { deleteScheduledUserAccounts } from "../helpers/cron_functions.js";
import logger from "../utils/logger.js";
import { Constants } from "../constants/values.js";
import { Env } from "../constants/enums.js";

export class CronService {
  static readonly init = () => {
    this.#scheduleDailyEmails();
    this.#scheduleRequestedUserDeletions();
  };

  static readonly #scheduleDailyEmails = () => {
    // Sends regular notifications/emails. Runs at 10 AM everyday.
    cron.schedule("0 0 10 * * *", () => {
      logger.info(`Sending emails at: ${new Date().toLocaleString()}`);
      // Send notifications / emails
      logger.info("Emails successfully sent.");
    });
  };

  static readonly #scheduleRequestedUserDeletions = () => {
    // Deletes due user accounts.
    // Runs at 12 AM and 12 PM everyday. (Prod)
    // Runs every 10 mins. (Dev)

    const cronExpression =
      Constants.env === Env.production ? "0 0 0,12 * * *" : "0 */10 * * * *";

    cron.schedule(cronExpression, async () => {
      logger.info("Starting scheduled user account deletion task.");
      await deleteScheduledUserAccounts();
      logger.info("Completed scheduled user account deletion task.");
    });
  };
}
