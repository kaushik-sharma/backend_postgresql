import { FindOptions, Includeable, literal } from "sequelize";
import { EntityStatus } from "../constants/enums.js";
import { COMMENTS_PAGE_SIZE, POSTS_PAGE_SIZE } from "../constants/values.js";
import { UserModel } from "../models/user/user_model.js";
import {
  CommentAttributes,
  CommentModel,
} from "../models/post/comment_model.js";
import { PostAttributes, PostModel } from "../models/post/post_model.js";
import {
  EmotionType,
  ReactionAttributes,
  ReactionModel,
} from "../models/post/reaction_model.js";
import UserDatasource from "./user_datasource.js";

export default class PostDatasource {
  static readonly createPost = async (
    postData: PostAttributes
  ): Promise<string> => {
    const post = new PostModel(postData);
    const result = await post.save();
    return result.toJSON().id!;
  };

  static readonly postExists = async (id: string): Promise<boolean> => {
    const post = await PostModel.findOne({
      where: {
        id: id,
        status: EntityStatus.active,
      },
      attributes: ["userId"],
    });

    if (post === null) return false;

    const isUserActive = await UserDatasource.isUserActive(
      post.toJSON().userId
    );
    if (!isUserActive) return false;

    return true;
  };

  static readonly createReaction = async (
    reactionData: ReactionAttributes
  ): Promise<void> => {
    const reaction = new ReactionModel({
      userId: reactionData.userId,
      postId: reactionData.postId,
      emotionType: reactionData.emotionType,
    });

    // Check if the user already has a reaction for that post
    const prevReaction = await ReactionModel.findOne({
      where: {
        postId: reactionData.postId,
        userId: reactionData.userId,
      },
    });

    // If it is a new reaction, then save it
    if (prevReaction === null) {
      await reaction.save();
    } else if (reactionData.emotionType === prevReaction.toJSON().emotionType) {
      // If same reaction as before then delete it
      await ReactionModel.destroy({
        where: {
          postId: reactionData.postId,
          userId: reactionData.userId,
        },
      });
    } else {
      // Else update it to the new reaction
      await ReactionModel.update(
        {
          emotionType: reactionData.emotionType,
        },
        { where: { postId: reactionData.postId, userId: reactionData.userId } }
      );
    }
  };

  static readonly commentExists = async (
    commentId: string,
    level?: number,
    postId?: string
  ): Promise<boolean> => {
    const query: Record<string, any> = {
      id: commentId,
      status: EntityStatus.active,
    };
    if (level !== undefined) {
      query.level = level;
    }
    if (postId !== undefined) {
      query.postId = postId;
    }

    const comment = await CommentModel.findOne({
      where: query,
      attributes: ["userId"],
    });
    if (comment === null) return false;

    const isUserActive = await UserDatasource.isUserActive(
      comment.toJSON().userId
    );
    if (!isUserActive) return false;

    return true;
  };

  static readonly createComment = async (
    commentData: CommentAttributes
  ): Promise<string> => {
    const comment = new CommentModel(commentData);
    const result = await comment.save();
    return result.toJSON().id!;
  };

  static readonly getPostUserId = async (postId: string): Promise<string> => {
    const post = await PostModel.findByPk(postId, {
      attributes: ["userId"],
    });
    return post!.toJSON().userId;
  };

  static readonly getPostImagePath = async (
    postId: string
  ): Promise<string | null> => {
    const post = await PostModel.findByPk(postId, {
      attributes: ["imagePath"],
    });
    return post!.toJSON().imagePath;
  };

  static readonly deletePost = async (
    postId: string,
    userId: string
  ): Promise<void> => {
    await PostModel.update(
      {
        status: EntityStatus.deleted,
      },
      {
        where: {
          id: postId,
          userId: userId,
        },
      }
    );
  };

  static readonly getCommentUserId = async (
    commentId: string
  ): Promise<string> => {
    const comment = await CommentModel.findByPk(commentId, {
      attributes: ["userId"],
    });
    return comment!.toJSON().userId;
  };

  static readonly deleteComment = async (
    commentId: string,
    userId: string
  ): Promise<void> => {
    await CommentModel.update(
      {
        status: EntityStatus.deleted,
      },
      {
        where: {
          id: commentId,
          userId: userId,
        },
      }
    );
  };

  static readonly #getComments = async (
    filterQuery: Record<string, any>,
    offset?: number
  ): Promise<CommentAttributes[]> => {
    const options: FindOptions = {
      where: filterQuery,
      include: [
        {
          model: UserModel,
          as: "user",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "profileImagePath",
            "status",
          ],
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
      nest: true,
    };
    if (offset !== undefined) {
      options.offset = offset;
      options.limit = COMMENTS_PAGE_SIZE;
    }

    const comments = await CommentModel.findAll(options);

    return comments.map((comment) => comment.toJSON());
  };

  static readonly getCommentsByPostId = async (
    postId: string
  ): Promise<CommentAttributes[]> => {
    return await this.#getComments({ postId: postId });
  };

  static readonly getCommentsByUserId = async (
    userId: string,
    page: number
  ): Promise<CommentAttributes[]> => {
    const offset = page * COMMENTS_PAGE_SIZE;
    return await this.#getComments(
      { userId: userId, status: EntityStatus.active },
      offset
    );
  };

  static readonly getCommentById = async (
    commentId: string
  ): Promise<CommentAttributes> => {
    const result = await this.#getComments({
      id: commentId,
      status: EntityStatus.active,
    });
    if (result.length === 0) {
      throw new Error("Comment not found");
    }
    return result[0];
  };

  static readonly #getPosts = async (
    page: number,
    {
      filterQuery = {},
      includeRepostedPost = true,
    }: { filterQuery?: Record<string, any>; includeRepostedPost?: boolean } = {}
  ): Promise<PostAttributes[]> => {
    const whereCondition: Record<string, any> = {
      ...(filterQuery ?? {}),
      status: EntityStatus.active,
    };

    const offset = page * POSTS_PAGE_SIZE;

    const include: Includeable[] = [
      {
        model: UserModel,
        as: "user",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "profileImagePath",
          "status",
        ],
        where: { status: EntityStatus.active },
        required: true,
      },
    ];
    if (includeRepostedPost) {
      include.push({
        model: PostModel,
        as: "repostedPost",
        attributes: {
          include: [
            [
              // Count likes for this reposted post.
              literal(`(
                SELECT CAST(COUNT(*) AS INTEGER) 
                FROM reactions AS r 
                INNER JOIN users AS ru ON r."userId" = ru."id"
                WHERE r."postId" = "repostedPost"."id" 
                  AND r."emotionType" = '${EmotionType.like}'
                  AND ru."status" = '${EntityStatus.active}'
              )`),
              "likeCount",
            ],
            [
              // Count dislikes for this reposted post.
              literal(`(
                SELECT CAST(COUNT(*) AS INTEGER) 
                FROM reactions AS r 
                INNER JOIN users AS ru ON r."userId" = ru."id"
                WHERE r."postId" = "repostedPost"."id" 
                  AND r."emotionType" = '${EmotionType.dislike}'
                  AND ru."status" = '${EntityStatus.active}'
              )`),
              "dislikeCount",
            ],
            [
              // Count active comments for this reposted post.
              literal(`(
                SELECT CAST(COUNT(*) AS INTEGER) 
                FROM comments AS c
                INNER JOIN users AS cu ON c."userId" = cu."id"
                WHERE c."postId" = "repostedPost"."id" 
                  AND c."status" = '${EntityStatus.active}'
                  AND cu."status" = '${EntityStatus.active}'
              )`),
              "commentCount",
            ],
          ],
        },
        include: [
          {
            model: UserModel,
            as: "user",
            attributes: [
              "id",
              "firstName",
              "lastName",
              "profileImagePath",
              "status",
            ],
            where: { status: EntityStatus.active },
            required: true,
          },
        ],
        where: { status: EntityStatus.active },
        required: false,
      });
    }

    const posts = await PostModel.findAll({
      where: whereCondition,
      attributes: {
        include: [
          [
            // Count likes for this post.
            literal(`(
              SELECT CAST(COUNT(*) AS INTEGER) 
              FROM reactions AS r 
              INNER JOIN users AS ru ON r."userId" = ru."id"
              WHERE r."postId" = "PostModel"."id" 
                AND r."emotionType" = '${EmotionType.like}'
                AND ru."status" = '${EntityStatus.active}'
            )`),
            "likeCount",
          ],
          [
            // Count dislikes for this post.
            literal(`(
              SELECT CAST(COUNT(*) AS INTEGER) 
              FROM reactions AS r 
              INNER JOIN users AS ru ON r."userId" = ru."id"
              WHERE r."postId" = "PostModel"."id" 
                AND r."emotionType" = '${EmotionType.dislike}'
                AND ru."status" = '${EntityStatus.active}'
            )`),
            "dislikeCount",
          ],
          [
            // Count active comments for this post.
            literal(`(
              SELECT CAST(COUNT(*) AS INTEGER) 
              FROM comments AS c
              INNER JOIN users AS cu ON c."userId" = cu."id"
              WHERE c."postId" = "PostModel"."id" 
                AND c."status" = '${EntityStatus.active}'
                AND cu."status" = '${EntityStatus.active}'
            )`),
            "commentCount",
          ],
        ],
      },
      include: include,
      order: [["createdAt", "DESC"]],
      offset: offset,
      limit: POSTS_PAGE_SIZE,
      nest: true,
    });

    return posts.map((post) => post.toJSON());
  };

  static readonly getPostsFeed = async (
    page: number
  ): Promise<PostAttributes[]> => {
    return await this.#getPosts(page);
  };

  static readonly getPostsByUserId = async (
    userId: string,
    page: number
  ): Promise<PostAttributes[]> => {
    return await this.#getPosts(page, {
      filterQuery: { userId: userId },
      includeRepostedPost: false,
    });
  };

  static readonly getPostById = async (
    postId: string
  ): Promise<PostAttributes> => {
    const result = await this.#getPosts(0, {
      filterQuery: { id: postId },
    });
    if (result.length === 0) {
      throw new Error("Post not found!");
    }
    return result[0];
  };

  static readonly banPost = async (postId: string): Promise<void> => {
    await PostModel.update(
      {
        status: EntityStatus.banned,
      },
      {
        where: { id: postId },
      }
    );
  };

  static readonly banComment = async (commentId: string): Promise<void> => {
    await CommentModel.update(
      {
        status: EntityStatus.banned,
      },
      {
        where: { id: commentId },
      }
    );
  };
}
