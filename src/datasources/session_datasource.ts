import { RedisService } from "../services/redis_service.js";
import { PrismaService } from "../services/prisma_service.js";
import { ActiveSessionInfo } from "../controllers/user_controller.js";
import { Prisma } from "../generated/prisma/index.js";

export class SessionDatasource {
  static readonly signOutSession = async (
    sessionId: string,
    userId: string
  ): Promise<void> => {
    await RedisService.client.del(`sessions:${sessionId}`);

    await PrismaService.client.session.delete({
      where: {
        id: sessionId,
        userId: userId,
      },
    });
  };

  static readonly signOutAllSessions = async (
    userId: string,
    transaction?: Prisma.TransactionClient
  ): Promise<void> => {
    const db = transaction ?? PrismaService.client;

    const sessions = await db.session.findMany({
      where: { userId: userId },
      select: { id: true },
    });
    const sessionIds = sessions.map((x) => x.id);

    for (const sessionId of sessionIds) {
      await RedisService.client.del(`sessions:${sessionId}`);
    }

    await db.session.deleteMany({
      where: { userId: userId },
    });
  };

  static readonly getActiveSessions = async (
    userId: string
  ): Promise<ActiveSessionInfo[]> => {
    return await PrismaService.client.session.findMany({
      where: { userId: userId },
      select: { id: true, deviceName: true, platform: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  };

  static readonly getUserIdFromSessionId = async (
    sessionId: string
  ): Promise<string | null> => {
    const result = await PrismaService.client.session.findFirst({
      where: { id: sessionId },
      select: {
        userId: true,
      },
    });
    return result?.userId ?? null;
  };
}
