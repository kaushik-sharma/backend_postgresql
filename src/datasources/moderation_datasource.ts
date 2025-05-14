import { ReportTargetType } from "../constants/enums.js";
import {
  ReportAttributes,
  ReportModel,
} from "../models/moderation/report_model.js";

export default class ModerationDatasource {
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

  static readonly getReportsCount = async (
    targetType: ReportTargetType
  ): Promise<number> => {
    return await ReportModel.count({
      where: { targetType },
    });
  };
}
