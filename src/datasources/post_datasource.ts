import { FindOptions, Includeable, literal } from "sequelize";
import { EntityStatus } from "../constants/enums.js";
import { COMMENTS_PAGE_SIZE, POSTS_PAGE_SIZE } from "../constants/values.js";
import { UserModel } from "../models/auth/user_model.js";
import { CommentModel } from "../models/post/comment_model.js";
import { PostModel } from "../models/post/post_model.js";
import { EmotionType, ReactionModel } from "../models/post/reaction_model.js";
import AuthDatasource from "./auth_datasource.js";

export default class PostDatasource {
  static readonly createPost = async (post: PostModel): Promise<void> => {
    await post.save();
  };

  static readonly postExists = async (id: string): Promise<boolean> => {
    const post = await PostModel.findOne({
      where: {
        id: id,
        status: EntityStatus.active,
      },
      attributes: ["userId"],
      raw: true,
    });

    if (post === null) return false;

    const isUserActive = await AuthDatasource.isUserActive(post.userId);
    if (!isUserActive) return false;

    return true;
  };

  static readonly createReaction = async (
    reaction: ReactionModel
  ): Promise<void> => {
    // Check if the user already has a reaction for that post
    const prevReaction = await ReactionModel.findOne({
      where: {
        postId: reaction.postId,
        userId: reaction.userId,
      },
      raw: true,
    });

    // If it is a new reaction, then save it
    if (prevReaction === null) {
      await reaction.save();
    } else if (reaction.emotionType === prevReaction.emotionType) {
      // If same reaction as before then delete it
      await ReactionModel.destroy({
        where: {
          postId: reaction.postId,
          userId: reaction.userId,
        },
      });
    } else {
      // Else update it to the new reaction
      await ReactionModel.update(
        {
          emotionType: reaction.emotionType,
        },
        { where: { postId: reaction.postId, userId: reaction.userId } }
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
      raw: true,
    });
    if (comment === null) return false;

    const isUserActive = await AuthDatasource.isUserActive(comment.userId);
    if (!isUserActive) return false;

    return true;
  };

  static readonly createComment = async (comment: CommentModel): Promise<string> => {
    const result = await comment.save();
    return result.id;
  };

  static readonly getPostUserId = async (postId: string): Promise<string> => {
    const post = await PostModel.findByPk(postId, {
      attributes: ["userId"],
      raw: true,
    });
    return post!.userId;
  };

  static readonly getPostImagePath = async (
    postId: string
  ): Promise<string | null> => {
    const post = await PostModel.findByPk(postId, {
      attributes: ["imagePath"],
      raw: true,
    });
    return post!.imagePath;
  };

  static readonly deletePost = async (
    postId: string,
    userId: string
  ): Promise<void> => {
    // TODO: Implement
    throw new Error("Unimplemented error.");
    // await PostModel.update(
    //   {
    //     status: EntityStatus.deleted,
    //   },
    //   {
    //     where: {
    //       id: postId,
    //       userId: userId,
    //     },
    //   }
    // );
  };

  static readonly getCommentUserId = async (
    commentId: string
  ): Promise<string> => {
    const comment = await CommentModel.findByPk(commentId, {
      attributes: ["userId"],
      raw: true,
    });
    return comment!.userId;
  };

  static readonly deleteComment = async (
    commentId: string,
    userId: string
  ): Promise<void> => {
    // TODO: Implement
    throw new Error("Unimplemented error.");
    // await CommentModel.update(
    //   {
    //     status: EntityStatus.deleted,
    //   },
    //   {
    //     where: {
    //       id: commentId,
    //       userId: userId,
    //     },
    //   }
    // );
  };

  static readonly #getComments = async (
    filterQuery: Record<string, any>,
    offset?: number
  ): Promise<CommentModel[]> => {
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
      raw: true,
      nest: true,
    };
    if (offset !== undefined) {
      options.offset = offset;
      options.limit = COMMENTS_PAGE_SIZE;
    }

    return await CommentModel.findAll(options);
  };

  static readonly getCommentsByPostId = async (
    postId: string
  ): Promise<CommentModel[]> => {
    return await this.#getComments({ postId: postId });
  };

  static readonly getCommentsByUserId = async (
    userId: string,
    page: number
  ): Promise<CommentModel[]> => {
    const offset = page * COMMENTS_PAGE_SIZE;
    return await this.#getComments(
      { userId: userId, status: EntityStatus.active },
      offset
    );
  };

  static readonly getCommentById = async (
    commentId: string
  ): Promise<CommentModel> => {
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
    filterQuery?: Record<string, any>
  ): Promise<PostModel[]> => {
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
    if (filterQuery === undefined) {
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

  static readonly getPostsFeed = async (page: number): Promise<PostModel[]> => {
    return await this.#getPosts(page);
  };

  static readonly getPostsByUserId = async (
    userId: string,
    page: number
  ): Promise<PostModel[]> => {
    return await this.#getPosts(page, { userId: userId });
  };

  static readonly getPostById = async (postId: string): Promise<PostModel> => {
    const result = await this.#getPosts(0, { id: postId });
    if (result.length === 0) {
      throw new Error("Post not found!");
    }
    return result[0];
  };
}
