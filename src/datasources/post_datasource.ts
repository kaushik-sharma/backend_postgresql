import { Constants } from "../constants/values.js";
import { PrismaService } from "../services/prisma_service.js";
import { FeedComment, FeedPost } from "../controllers/post_controller.js";
import {
  Prisma,
  EntityStatus,
  EmotionType,
} from "../generated/prisma/index.js";

export class PostDatasource {
  static readonly createPost = async (
    data: Prisma.PostCreateInput
  ): Promise<string> => {
    const post = await PrismaService.client.post.create({ data: data });
    return post.id;
  };

  static readonly postExists = async (id: string): Promise<boolean> => {
    const count = await PrismaService.client.post.count({
      where: {
        id,
        status: EntityStatus.ACTIVE,
        user: { status: EntityStatus.ACTIVE },
      },
    });
    return count > 0;
  };

  static readonly createReaction = async (
    data: Prisma.ReactionCreateInput
  ): Promise<void> => {
    // Check if the user already has a reaction for that post
    const prevReaction = await PrismaService.client.reaction.findFirst({
      where: { postId: data.post.connect!.id!, userId: data.user.connect!.id! },
      select: { emotionType: true },
    });

    // If same reaction as before then delete it
    if (data.emotionType === prevReaction?.emotionType) {
      await PrismaService.client.reaction.delete({
        where: {
          userId_postId: {
            postId: data.post.connect!.id!,
            userId: data.user.connect!.id!,
          },
        },
      });
      return;
    }

    // Save new or update the existing reaction
    await PrismaService.client.reaction.upsert({
      where: {
        userId_postId: {
          postId: data.post.connect!.id!,
          userId: data.user.connect!.id!,
        },
      },
      create: { ...data },
      update: { emotionType: data.emotionType },
    });
  };

  static readonly commentExists = async (
    commentId: string,
    level?: number,
    postId?: string
  ): Promise<boolean> => {
    const query: Record<string, any> = {
      id: commentId,
      status: EntityStatus.ACTIVE,
    };
    if (level !== undefined) {
      query.level = level;
    }
    if (postId !== undefined) {
      query.postId = postId;
    }

    const count = await PrismaService.client.comment.count({
      where: {
        ...query,
        user: { status: EntityStatus.ACTIVE },
      },
    });
    return count > 0;
  };

  static readonly createComment = async (
    data: Prisma.CommentCreateInput
  ): Promise<string> => {
    const comment = await PrismaService.client.comment.create({ data });
    return comment.id;
  };

  static readonly getPostUserId = async (
    postId: string
  ): Promise<string | null> => {
    const post = await PrismaService.client.post.findFirst({
      where: { id: postId, status: EntityStatus.ACTIVE },
      select: { userId: true },
    });
    return post?.userId ?? null;
  };

  static readonly getPostImagePath = async (
    postId: string
  ): Promise<string | null> => {
    const post = await PrismaService.client.post.findFirst({
      where: { id: postId },
      select: { imagePath: true },
    });
    return post!.imagePath;
  };

  static readonly deletePost = async (
    postId: string,
    userId: string
  ): Promise<void> => {
    await PrismaService.client.post.update({
      where: { id: postId, userId: userId },
      data: {
        status: EntityStatus.DELETED,
        deletedAt: new Date(),
      },
    });
  };

  static readonly getCommentUserId = async (
    commentId: string
  ): Promise<string | null> => {
    const comment = await PrismaService.client.comment.findFirst({
      where: { id: commentId, status: EntityStatus.ACTIVE },
      select: { userId: true },
    });
    return comment?.userId ?? null;
  };

  static readonly deleteComment = async (
    commentId: string,
    userId: string
  ): Promise<void> => {
    await PrismaService.client.comment.update({
      where: { id: commentId, userId: userId },
      data: {
        status: EntityStatus.DELETED,
        deletedAt: new Date(),
      },
    });
  };

  static readonly #getComments = async (
    filterQuery: Record<string, any>,
    offset?: number
  ): Promise<FeedComment[]> => {
    const offsetFields: Record<string, any> = {};
    if (offset) {
      offsetFields.skip = offset;
      offsetFields.take = Constants.commentsPageSize;
    }

    const comments = await PrismaService.client.comment.findMany({
      where: filterQuery,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImagePath: true,
            status: true,
          },
        },
      },
      ...offsetFields,
    });

    return comments;
  };

  static readonly getCommentsByPostId = async (
    postId: string
  ): Promise<FeedComment[]> => {
    return await this.#getComments({ postId: postId });
  };

  static readonly getCommentsByUserId = async (
    userId: string,
    page: number
  ): Promise<FeedComment[]> => {
    const offset = page * Constants.commentsPageSize;
    return await this.#getComments(
      { userId: userId, status: EntityStatus.ACTIVE },
      offset
    );
  };

  static readonly getCommentById = async (
    commentId: string
  ): Promise<FeedComment> => {
    const result = await this.#getComments({
      id: commentId,
      status: EntityStatus.ACTIVE,
    });
    if (result.length === 0) {
      throw new Error("Comment not found");
    }
    return result[0];
  };

  static readonly #getPosts = async (
    page: number,
    {
      postId,
      userId,
      includeRepostedPost,
    }: {
      postId?: string | null;
      userId?: string | null;
      includeRepostedPost?: boolean;
    } = { postId: null, userId: null, includeRepostedPost: true }
  ): Promise<FeedPost[]> => {
    const whereQuery: Prisma.PostWhereInput = {
      status: EntityStatus.ACTIVE,
      user: { status: EntityStatus.ACTIVE },
    };
    if (postId) {
      whereQuery.id = postId;
    }
    if (userId) {
      whereQuery.userId = userId;
    }

    const posts = await PrismaService.client.post.findMany({
      where: whereQuery,
      select: {
        id: true,
        text: true,
        imagePath: true,
        status: true,
        createdAt: true,
        // Creator info
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImagePath: true,
            status: true,
          },
        },
        // Conditionally include the repost
        repostedPost: includeRepostedPost
          ? {
              select: {
                id: true,
                text: true,
                imagePath: true,
                status: true,
                createdAt: true,
                // Creator info
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profileImagePath: true,
                    status: true,
                  },
                },
                // Count relations on the post
                _count: {
                  select: {
                    comments: true,
                  },
                },
              },
            }
          : false,
        // Count relations on the post
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: page * Constants.postsPageSize,
      take: Constants.postsPageSize,
    });

    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        // 1) Count likes/dislikes on the main post
        const [likesCount, dislikesCount] =
          await PrismaService.client.$transaction([
            PrismaService.client.reaction.count({
              where: {
                postId: post.id,
                emotionType: EmotionType.LIKE,
                user: { status: EntityStatus.ACTIVE },
              },
            }),
            PrismaService.client.reaction.count({
              where: {
                postId: post.id,
                emotionType: EmotionType.DISLIKE,
                user: { status: EntityStatus.ACTIVE },
              },
            }),
          ]);

        let repostLikesCount: number | null = null;
        let repostDislikesCount: number | null = null;

        // 2) If there’s a repost, count on that too
        if (post.repostedPost) {
          const repostId = post.repostedPost.id;
          [repostLikesCount, repostDislikesCount] =
            await PrismaService.client.$transaction([
              PrismaService.client.reaction.count({
                where: {
                  postId: repostId,
                  emotionType: EmotionType.LIKE,
                  user: { status: EntityStatus.ACTIVE },
                },
              }),
              PrismaService.client.reaction.count({
                where: {
                  postId: repostId,
                  emotionType: EmotionType.DISLIKE,
                  user: { status: EntityStatus.ACTIVE },
                },
              }),
            ]);
        }

        // 3) Return a combined object
        return {
          ...post,
          likesCount,
          dislikesCount,
          repostLikesCount,
          repostDislikesCount,
        };
      })
    );

    return postsWithCounts.map(
      (post) =>
        <FeedPost>{
          id: post.id,
          text: post.text,
          imagePath: post.imagePath,
          status: post.status,
          createdAt: post.createdAt,
          user: post.user,
          repostedPost: post.repostedPost,
          likeCount: post.likesCount,
          dislikeCount: post.dislikesCount,
          commentCount: post._count.comments,
        }
    );
  };

  static readonly getPostsFeed = async (page: number): Promise<FeedPost[]> => {
    return await this.#getPosts(page);
  };

  static readonly getPostsByUserId = async (
    userId: string,
    page: number
  ): Promise<FeedPost[]> => {
    return await this.#getPosts(page, {
      userId: userId,
      includeRepostedPost: false,
    });
  };

  static readonly getPostById = async (postId: string): Promise<FeedPost> => {
    const result = await this.#getPosts(0, {
      postId: postId,
    });
    if (result.length === 0) {
      throw new Error("Post not found!");
    }
    return result[0];
  };

  static readonly banPost = async (
    postId: string,
    transaction: Prisma.TransactionClient
  ): Promise<void> => {
    await transaction.post.update({
      where: { id: postId },
      data: { status: EntityStatus.BANNED, bannedAt: new Date() },
    });
  };

  static readonly banComment = async (
    commentId: string,
    transaction: Prisma.TransactionClient
  ): Promise<void> => {
    await transaction.comment.update({
      where: { id: commentId },
      data: { status: EntityStatus.BANNED, bannedAt: new Date() },
    });
  };
}
