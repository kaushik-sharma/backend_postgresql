import sequelize, { Op, Transaction } from "sequelize";

import { ReportStatus, ReportTargetType } from "../constants/enums.js";
import { Constants } from "../constants/values.js";
import {
  ReportAttributes,
  ReportModel,
} from "../models/moderation/report_model.js";

export class ModerationDatasource {
  static readonly createReport = async (
    data: ReportAttributes
  ): Promise<void> => {
    try {
      await ReportModel.create(data);
    } catch (err: any) {
      // Silently ignoring on duplicate entries
      if (err.name === "SequelizeUniqueConstraintError") return;

      throw err;
    }
  };

  static readonly fetchOverThresholdIds = async (
    targetType: ReportTargetType
  ): Promise<string[]> => {
    const threshold = Constants.contentModerationThreshold(targetType);

    const reports = await ReportModel.findAll({
      attributes: ["targetId"],
      where: { targetType, status: ReportStatus.active },
      group: ["targetId"],
      having: sequelize.where(
        sequelize.fn("COUNT", sequelize.col("targetId")),
        { [Op.gte]: threshold }
      ),
    });

    return reports.map((report) => report.toJSON().targetId);
  };

  static readonly markAsResolved = async (
    targetIds: string[],
    transaction: Transaction
  ): Promise<void> => {
    const result = await ReportModel.update(
      {
        status: ReportStatus.resolved,
      },
      {
        where: {
          targetId: { [Op.in]: targetIds },
        },
        transaction,
      }
    );

    if (result[0] === 0) {
      throw new Error("Report target Ids not resolved.");
    }
  };
}
