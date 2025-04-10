import { ObjectId } from "mongodb";

import {
  CommentModel,
  CommentType,
  CommentViewModel,
  CommentViewType,
} from "../models/post/comment_model.js";
import {
  PostModel,
  PostType,
  PostFeedModel,
  PostFeedType,
} from "../models/post/post_model.js";
import {
  EmotionType,
  ReactionModel,
  ReactionType,
} from "../models/post/reaction_model.js";
import AuthDatasource from "./auth_datasource.js";
import {
  COMMENTS_PAGE_SIZE,
  DEFAULT_PROFILE_IMAGE_PATH,
  POSTS_PAGE_SIZE,
} from "../constants/values.js";
import AwsS3Service from "../services/aws_s3_service.js";
import { validateModel } from "../helpers/validation_helpers.js";
import { EntityStatus } from "../constants/enums.js";

export default class PostDatasource {
  static readonly createPost = async (postData: PostType): Promise<void> => {
    const post = new PostModel(postData);
    await post.save();
  };

  static readonly postExists = async (id: string): Promise<boolean> => {
    const result = await PostModel.findOne(
      { _id: id, status: EntityStatus.active },
      { userId: true }
    );
    if (result === null) return false;

    const isUserActive = await AuthDatasource.isUserActive(
      result!.userId.toString()
    );
    if (!isUserActive) return false;

    return true;
  };

  static readonly createReaction = async (
    reactionData: ReactionType
  ): Promise<void> => {
    const reaction = new ReactionModel(reactionData);

    /// Check if the user already has a reaction for that post
    const prevReaction = await ReactionModel.findOne(
      {
        postId: reaction.postId,
        userId: reaction.userId,
      },
      { emotionType: true }
    );

    /// If it is a new reaction, then save it
    if (prevReaction === null) {
      await reaction.save();
      return;
    }

    if (reaction.emotionType === prevReaction.emotionType) {
      /// If same reaction as before then delete it
      await ReactionModel.deleteOne({
        postId: reaction.postId,
        userId: reaction.userId,
      });
    } else {
      /// Else update it to the new reaction
      await ReactionModel.updateOne(
        {
          postId: reaction.postId,
          userId: reaction.userId,
        },
        { $set: { emotionType: reaction.emotionType } }
      );
    }
  };

  static readonly commentExists = async (
    commentId: string,
    level?: number,
    postId?: string
  ): Promise<boolean> => {
    const query: Record<string, any> = {
      _id: commentId,
      status: EntityStatus.active,
    };
    if (level !== undefined) {
      query.level = level;
    }
    if (postId !== undefined) {
      query.postId = postId;
    }

    const result = await CommentModel.findOne(query, { userId: true });
    if (result === null) return false;

    const isUserActive = await AuthDatasource.isUserActive(
      result!.userId.toString()
    );
    if (!isUserActive) return false;

    return true;
  };

  static readonly createComment = async (
    commentData: CommentType
  ): Promise<void> => {
    const comment = new CommentModel(commentData);
    await comment.save();
  };

  static readonly getCommentsByPostId = async (
    postId: string
  ): Promise<CommentViewType[]> => {
    const isActiveCondition = {
      $and: [
        { $eq: ["$status", EntityStatus.active] },
        { $eq: ["$user.status", EntityStatus.active] },
      ],
    };

    const getEffectiveStatus = (
      commentStatus: EntityStatus,
      userStatus: EntityStatus
    ): EntityStatus =>
      userStatus !== EntityStatus.active ? userStatus : commentStatus;

    const docs = await CommentModel.aggregate([
      { $match: { postId: new ObjectId(postId) } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      // Unwind the user array to flatten the structure
      { $unwind: "$user" },
      {
        $project: {
          firstName: {
            $cond: {
              if: isActiveCondition,
              then: "$user.firstName",
              else: null,
            },
          },
          lastName: {
            $cond: {
              if: isActiveCondition,
              then: "$user.lastName",
              else: null,
            },
          },
          profileImagePath: {
            $cond: {
              if: isActiveCondition,
              then: "$user.profileImagePath",
              else: null,
            },
          },
          userStatus: "$user.status",
          text: {
            $cond: {
              if: isActiveCondition,
              then: "$text",
              else: null,
            },
          },
          createdAt: {
            $cond: {
              if: isActiveCondition,
              then: "$createdAt",
              else: null,
            },
          },
          parentCommentId: true,
          status: true,
        },
      },
    ]);

    const comments: CommentViewType[] = [];
    for (const doc of docs) {
      let profileImageUrl: string | null = null;
      if (
        doc.status === EntityStatus.active &&
        doc.userStatus === EntityStatus.active
      ) {
        profileImageUrl = AwsS3Service.getCloudfrontDownloadUrl(
          doc.profileImagePath ?? DEFAULT_PROFILE_IMAGE_PATH
        );
      }
      const status = getEffectiveStatus(doc.status, doc.userStatus);
      const data: Record<string, any> = {
        ...doc,
        profileImageUrl: profileImageUrl,
        status: status,
      };
      const comment = new CommentViewModel(data);
      validateModel(comment);
      comments.push(comment);
    }

    return comments;
  };

  static readonly getPostUserId = async (postId: string): Promise<string> => {
    const result = await PostModel.findOne(
      {
        _id: postId,
        status: EntityStatus.active,
      },
      {
        userId: true,
      }
    );
    return result!.userId.toString();
  };

  static readonly getPostImagePath = async (
    postId: string
  ): Promise<string | null> => {
    const result = await PostModel.findOne(
      {
        _id: postId,
        status: EntityStatus.active,
      },
      {
        _id: false,
        imagePath: true,
      }
    ).lean();
    return (result as Record<string, any>)["imagePath"]!;
  };

  static readonly deletePost = async (
    postId: string,
    userId: string
  ): Promise<void> => {
    await PostModel.updateOne(
      {
        _id: postId,
        userId: userId,
      },
      { $set: { status: EntityStatus.deleted } }
    );
  };

  static readonly getCommentUserId = async (
    commentId: string
  ): Promise<string> => {
    const result = await CommentModel.findOne(
      { _id: commentId, status: EntityStatus.active },
      { userId: true }
    );
    return result!.userId.toString();
  };

  static readonly deleteComment = async (
    commentId: string,
    userId: string
  ): Promise<void> => {
    await CommentModel.updateOne(
      {
        _id: commentId,
        userId: userId,
      },
      {
        $set: { status: EntityStatus.deleted },
      }
    );
  };

  static readonly #postsAggregatePipeline = async (
    page: number,
    userId?: string
  ): Promise<PostFeedType[]> => {
    const matchStage: Record<string, any> = { status: EntityStatus.active };

    if (userId !== undefined) {
      matchStage.userId = new ObjectId(userId!);
    }

    const postFeedAggregationPipeline = [
      // Join reactions to calculate like and dislike counts
      {
        $lookup: {
          from: "reactions",
          let: { postId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$postId", "$$postId"] } } },
            { $group: { _id: "$emotionType", count: { $sum: 1 } } },
          ],
          as: "reactionCounts",
        },
      },
      {
        $addFields: {
          likes: {
            $ifNull: [
              {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$reactionCounts",
                      as: "r",
                      cond: { $eq: ["$$r._id", EmotionType.like] },
                    },
                  },
                  0,
                ],
              },
              { count: 0 },
            ],
          },
          dislikes: {
            $ifNull: [
              {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$reactionCounts",
                      as: "r",
                      cond: { $eq: ["$$r._id", EmotionType.dislike] },
                    },
                  },
                  0,
                ],
              },
              { count: 0 },
            ],
          },
        },
      },
      // Join comments to count them directly
      {
        $lookup: {
          from: "comments",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$postId", "$$postId"] }],
                },
              },
            },
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$status", EntityStatus.active] }],
                },
              },
            },
            { $count: "commentCount" },
          ],
          as: "comments",
        },
      },
      {
        $addFields: {
          commentCount: {
            $ifNull: [{ $arrayElemAt: ["$comments.commentCount", 0] }, 0],
          },
        },
      },
      // Join users to get author details
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                profileImagePath: 1,
                status: 1,
              },
            },
          ],
          as: "user",
        },
      },
      {
        $addFields: {
          user: {
            $ifNull: [{ $arrayElemAt: ["$user", 0] }, {}],
          },
        },
      },
      // Filter out posts where the user's status is not ACTIVE
      {
        $match: {
          "user.status": EntityStatus.active,
        },
      },
      // =============== This step is only allowed for paid Atlas tiers ===============
      // Add a field for the image download URL
      // {
      //   $addFields: {
      //     imageUrl: {
      //       $cond: {
      //         if: { $not: ["$imageName"] },
      //         then: null,
      //         else: {
      //           $function: {
      //             body: "async function(name) { return await AwsS3Service.getDownloadUrl(name); }",
      //             args: ["$imageName"],
      //             lang: "js",
      //           },
      //         },
      //       },
      //     },
      //   },
      // },
    ];

    const docs = await PostModel.aggregate([
      { $match: matchStage },
      ...postFeedAggregationPipeline,
      // Add lookup for reposted post using the same pipeline
      {
        $lookup: {
          from: "posts",
          localField: "repostedPostId",
          foreignField: "_id",
          pipeline: [
            ...postFeedAggregationPipeline,
            {
              $project: {
                _id: 1,
                text: 1,
                imagePath: 1,
                likeCount: "$likes.count",
                dislikeCount: "$dislikes.count",
                commentCount: 1,
                userId: "$user._id",
                firstName: "$user.firstName",
                lastName: "$user.lastName",
                profileImagePath: "$user.profileImagePath",
                createdAt: 1,
              },
            },
          ],
          as: "repostedPost",
        },
      },
      {
        $addFields: {
          repostedPost: {
            $ifNull: [{ $arrayElemAt: ["$repostedPost", 0] }, null],
          },
        },
      },
      // Project only the necessary fields
      {
        $project: {
          _id: 1,
          text: 1,
          imagePath: 1,
          likeCount: "$likes.count",
          dislikeCount: "$dislikes.count",
          commentCount: 1,
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          profileImagePath: "$user.profileImagePath",
          createdAt: 1,
          repostedPost: 1,
        },
      },
      // Add sorting stages
      { $sort: { createdAt: -1 } },
      // Add pagination stages
      { $skip: page * POSTS_PAGE_SIZE },
      { $limit: POSTS_PAGE_SIZE },
    ]);

    const posts: PostFeedType[] = [];
    for (const doc of docs) {
      const postImageUrl =
        doc.imagePath !== null
          ? AwsS3Service.getCloudfrontDownloadUrl(doc.imagePath)
          : null;

      const profileImageUrl = AwsS3Service.getCloudfrontDownloadUrl(
        doc.profileImagePath ?? DEFAULT_PROFILE_IMAGE_PATH
      );

      const repostedPostImageUrl =
        doc.repostedPost !== null && doc.repostedPost.imagePath !== null
          ? AwsS3Service.getCloudfrontDownloadUrl(doc.repostedPost.imagePath)
          : null;

      const repostedPostProfileImageUrl =
        doc.repostedPost !== null
          ? AwsS3Service.getCloudfrontDownloadUrl(
              doc.repostedPost.profileImagePath ?? DEFAULT_PROFILE_IMAGE_PATH
            )
          : null;

      const repostedPostData =
        doc.repostedPost !== null
          ? {
              ...doc.repostedPost,
              imageUrl: repostedPostImageUrl,
              profileImageUrl: repostedPostProfileImageUrl,
            }
          : null;

      const postData = {
        ...doc,
        imageUrl: postImageUrl,
        profileImageUrl: profileImageUrl,
        repostedPost: repostedPostData,
      };

      posts.push(new PostFeedModel(postData));
    }

    return posts;
  };

  static readonly getPostsByUserId = async (
    userId: string,
    page: number
  ): Promise<PostFeedType[]> => {
    return await PostDatasource.#postsAggregatePipeline(page, userId);
  };

  static readonly getCommentsByUserId = async (
    userId: string,
    page: number
  ): Promise<CommentViewType[]> => {
    const docs = await CommentModel.aggregate([
      { $match: { userId: new ObjectId(userId), status: EntityStatus.active } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      // Unwind the user array to flatten the structure
      { $unwind: "$user" },
      {
        $project: {
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          profileImagePath: "$user.profileImagePath",
          createdAt: true,
          text: true,
          status: true,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: page * COMMENTS_PAGE_SIZE },
      { $limit: COMMENTS_PAGE_SIZE },
    ]);

    const comments: CommentViewType[] = [];
    for (const doc of docs) {
      const profileImageUrl = AwsS3Service.getCloudfrontDownloadUrl(
        doc.profileImagePath ?? DEFAULT_PROFILE_IMAGE_PATH
      );
      const data = {
        ...doc,
        profileImageUrl: profileImageUrl,
      };
      const comment = new CommentViewModel(data);
      validateModel(comment);
      comments.push(comment);
    }

    return comments;
  };

  static readonly getPostsFeed = async (
    page: number
  ): Promise<PostFeedType[]> => {
    return await PostDatasource.#postsAggregatePipeline(page);
  };
}
