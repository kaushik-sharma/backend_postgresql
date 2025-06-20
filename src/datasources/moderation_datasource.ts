import { Constants } from "../constants/values.js";
import { PrismaService } from "../services/prisma_service.js";
import {
  Prisma,
  ReportTargetType,
  ReportStatus,
} from "../generated/prisma/index.js";

export class ModerationDatasource {
  static readonly createReport = async (
    data: Prisma.ReportCreateInput
  ): Promise<void> => {
    try {
      await PrismaService.client.report.create({ data });
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

    const reports = await PrismaService.client.report.groupBy({
      by: ["targetId"],
      where: { targetType, status: ReportStatus.ACTIVE },
      having: { targetId: { _count: { gte: threshold } } },
    });

    return reports.map((report) => report.targetId);
  };

  static readonly markAsResolved = async (
    targetIds: string[],
    transaction: Prisma.TransactionClient
  ): Promise<void> => {
    await transaction.report.updateMany({
      where: {
        targetId: { in: targetIds },
      },
      data: { status: ReportStatus.RESOLVED },
    });
  };
}
