import { PrismaService } from "../services/prisma_service.js";
import { ProfileUser } from "../controllers/user_controller.js";
import { Prisma, User, EntityStatus } from "../generated/prisma/index.js";

export class UserDatasource {
  static readonly isUserActive = async (userId: string): Promise<boolean> => {
    const count = await PrismaService.client.user.count({
      where: { id: userId, status: EntityStatus.ACTIVE },
    });
    if (count > 1) {
      throw new Error("Multiple active users found!");
    }
    return count === 1;
  };

  static readonly findUserByEmail = async (
    email: string
  ): Promise<Pick<User, "id" | "status"> | null> => {
    return await PrismaService.client.user.findFirst({
      where: {
        email,
        status: { not: EntityStatus.DELETED },
      },
      select: {
        id: true,
        status: true,
      },
    });
  };

  static readonly userByEmailExists = async (
    email: string
  ): Promise<boolean> => {
    const count = await PrismaService.client.user.count({
      where: {
        email,
        status: { not: EntityStatus.DELETED },
      },
    });

    return count > 0;
  };

  static readonly userByPhoneNumberExists = async (
    countryCode: string,
    phoneNumber: string
  ): Promise<boolean> => {
    const count = await PrismaService.client.user.count({
      where: {
        countryCode,
        phoneNumber,
        status: { not: EntityStatus.DELETED },
      },
    });

    return count > 0;
  };

  static readonly deleteAnonymousUser = async (
    userId: string,
    transaction: Prisma.TransactionClient
  ): Promise<void> => {
    await transaction.user.delete({
      where: { id: userId, status: EntityStatus.ANONYMOUS },
    });
  };

  static readonly createUser = async (
    user: Prisma.UserCreateInput,
    transaction: Prisma.TransactionClient
  ): Promise<string> => {
    const createdUser = await transaction.user.create({ data: user });
    return createdUser.id;
  };

  static readonly anonymousUserExists = async (
    userId: string
  ): Promise<boolean> => {
    const count = await PrismaService.client.user.count({
      where: {
        id: userId,
        status: EntityStatus.ANONYMOUS,
      },
    });
    return count > 0;
  };

  static readonly convertAnonymousUserToActive = async (
    anonymousUserId: string,
    user: Prisma.UserCreateInput,
    transaction: Prisma.TransactionClient
  ): Promise<string> => {
    const createdUser = await transaction.user.update({
      where: { id: anonymousUserId, status: EntityStatus.ANONYMOUS },
      data: user,
    });
    return createdUser.id;
  };

  static readonly markUserForDeletion = async (
    userId: string,
    transaction: Prisma.TransactionClient
  ): Promise<void> => {
    await transaction.user.update({
      where: { id: userId, status: EntityStatus.ACTIVE },
      data: {
        status: EntityStatus.REQUESTED_DELETION,
      },
    });
  };

  static readonly getUserById = async (
    userId: string,
    fields: string[],
    currentUserId?: string
  ): Promise<ProfileUser | null> => {
    const selectFields = fields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);

    const user = await PrismaService.client.user.findFirst({
      where: {
        id: userId,
        status: EntityStatus.ACTIVE,
      },
      select: {
        ...selectFields,
        _count: {
          select: {
            followees: true,
            followers: true,
          },
        },
        followers: currentUserId
          ? {
              where: { followerId: currentUserId },
              select: { id: true },
              take: 1,
            }
          : false,
      },
    });

    if (!user) return null;

    const isFollowee =
      Array.isArray(user.followers) && user.followers.length > 0;

    const profileUser: ProfileUser = {
      ...(user as unknown as User),
      followeeCount: user._count.followees,
      followerCount: user._count.followers,
      isFollowee: isFollowee,
    };

    return profileUser;
  };

  static readonly deleteUser = async (
    userId: string,
    transaction: Prisma.TransactionClient
  ): Promise<void> => {
    await transaction.user.update({
      where: { id: userId },
      data: {
        status: EntityStatus.DELETED,
        deletedAt: new Date(),
      },
    });
  };

  static readonly updateProfile = async (
    userId: string,
    updatedFields: Record<string, any>,
    transaction: Prisma.TransactionClient
  ): Promise<void> => {
    await transaction.user.update({
      where: { id: userId, status: EntityStatus.ACTIVE },
      data: { ...updatedFields },
    });
  };

  static readonly getUserProfileImagePath = async (
    userId: string
  ): Promise<string | null> => {
    const result = await PrismaService.client.user.findUnique({
      where: { id: userId },
      select: { profileImagePath: true },
    });
    return result?.profileImagePath ?? null;
  };

  static readonly deleteProfileImage = async (
    userId: string,
    transaction?: Prisma.TransactionClient
  ): Promise<void> => {
    const db = transaction ?? PrismaService.client;

    await db.user.update({
      where: {
        id: userId,
        status: {
          in: [EntityStatus.ACTIVE, EntityStatus.REQUESTED_DELETION],
        },
      },
      data: { profileImagePath: null },
    });
  };

  static readonly createUserDeletionRequest = async (
    data: Prisma.UserDeletionRequestCreateInput,
    transaction: Prisma.TransactionClient
  ): Promise<void> => {
    await transaction.userDeletionRequest.create({ data: data });
  };

  static readonly getDueDeletionUserIds = async (): Promise<string[]> => {
    const result = await PrismaService.client.userDeletionRequest.findMany({
      where: {
        deleteAt: {
          lte: new Date(),
        },
      },
      select: { userId: true },
    });

    return result.map((x) => x.userId);
  };

  static readonly removeDeletionRequest = async (
    userId: string,
    transaction: Prisma.TransactionClient
  ): Promise<void> => {
    await transaction.userDeletionRequest.delete({ where: { userId: userId } });
  };

  static readonly banUser = async (
    userId: string,
    transaction: Prisma.TransactionClient
  ): Promise<void> => {
    await transaction.user.update({
      where: { id: userId },
      data: {
        status: EntityStatus.BANNED,
        bannedAt: new Date(),
      },
    });
  };

  static readonly setUserAsActive = async (
    userId: string,
    transaction: Prisma.TransactionClient
  ): Promise<void> => {
    await transaction.user.update({
      where: { id: userId },
      data: { status: EntityStatus.ACTIVE },
    });
  };
}
