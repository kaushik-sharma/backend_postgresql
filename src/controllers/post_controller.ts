import { RequestHandler } from "express";
import { arrayToTree } from "performant-array-to-tree";

import { validateData } from "../helpers/validation_helper.js";
import {
  createCommentSchema,
  CreateCommentType,
  createPostSchema,
  CreatePostType,
  createReactionSchema,
  CreateReactionType,
} from "../validation/post_schema.js";
import { asyncHandler } from "../helpers/async_handler.js";
import { PostDatasource } from "../datasources/post_datasource.js";
import { CustomError } from "../middlewares/error_middlewares.js";
import { AwsS3Service, AwsS3FileCategory } from "../services/aws_s3_service.js";
import { PostAttributes } from "../models/post/post_model.js";
import { EntityStatus } from "../constants/enums.js";
import { SocketManager } from "../socket.js";
import { successResponseHandler } from "../helpers/success_handler.js";
import { ReactionAttributes } from "../models/post/reaction_model.js";
import { CommentAttributes } from "../models/post/comment_model.js";
import { Constants } from "../constants/values.js";
import { FeedPostDto, FeedPostParams } from "../dtos/feed_post_dto.js";
import { FeedCommentDto } from "../dtos/feed_comment_dto.js";
// import { KafkaService } from "../services/kafka_service.js";

export class PostController {
  static readonly validateCreatePostRequest: RequestHandler = (
    req,
    res,
    next
  ) => {
    req.parsedData = validateData(createPostSchema, req.body);
    next();
  };

  static readonly createPost: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const parsedData = req.parsedData! as CreatePostType;

      if (parsedData.repostedPostId !== undefined) {
        const postExists: boolean = await PostDatasource.postExists(
          parsedData.repostedPostId
        );
        if (!postExists) {
          throw new CustomError(404, "Reposted post not found!");
        }
      }

      let imagePath: string | null = null;
      let imageUrl: string | null = null;
      const imageFile = req.file as Express.Multer.File | undefined;
      if (imageFile !== undefined) {
        imagePath = await AwsS3Service.uploadFile(
          imageFile,
          AwsS3FileCategory.posts
        );
        imageUrl = AwsS3Service.getCloudFrontSignedUrl(imagePath);
      }

      const postData: PostAttributes = {
        userId: userId,
        text: parsedData.text,
        imagePath: imagePath,
        repostedPostId: parsedData.repostedPostId ?? null,
        status: EntityStatus.active,
      };
      const postId = await PostDatasource.createPost(postData);

      const createdPostData = await PostDatasource.getPostById(postId);

      const profileImageUrl = AwsS3Service.getCloudFrontSignedUrl(
        createdPostData.user!.profileImagePath ??
          Constants.defaultProfileImagePath
      );

      let repostedPostParams: FeedPostParams | null = null;
      if (parsedData.repostedPostId !== undefined) {
        const repostedPost = createdPostData.repostedPost!;
        const imageUrl =
          repostedPost.imagePath !== null
            ? AwsS3Service.getCloudFrontSignedUrl(repostedPost.imagePath)
            : null;
        const profileImageUrl = AwsS3Service.getCloudFrontSignedUrl(
          repostedPost.user!.profileImagePath ??
            Constants.defaultProfileImagePath
        );

        repostedPostParams = {
          id: repostedPost.id!,
          text: repostedPost.text,
          imageUrl: imageUrl,
          likeCount: repostedPost.likeCount!,
          dislikeCount: repostedPost.dislikeCount!,
          commentCount: repostedPost.commentCount!,
          createdAt: repostedPost.createdAt!,
          repostedPost: null,
          creator: {
            id: repostedPost.user!.id!,
            firstName: repostedPost.user!.firstName!,
            lastName: repostedPost.user!.lastName!,
            profileImageUrl: profileImageUrl,
          },
          status: repostedPost.status,
        };
      }

      const createdPostDto = new FeedPostDto({
        id: createdPostData.id!,
        text: createdPostData.text,
        imageUrl: imageUrl,
        likeCount: createdPostData.likeCount!,
        dislikeCount: createdPostData.dislikeCount!,
        commentCount: createdPostData.commentCount!,
        createdAt: createdPostData.createdAt!,
        repostedPost: repostedPostParams,
        creator: {
          id: createdPostData.user!.id!,
          firstName: createdPostData.user!.firstName!,
          lastName: createdPostData.user!.lastName!,
          profileImageUrl: profileImageUrl,
        },
        status: createdPostData.status,
      });

      SocketManager.io.emit("newPostsAvailable", {
        message: "New posts added. Refresh the feed.",
      });

      successResponseHandler({
        res: res,
        status: 200,
        data: createdPostDto,
      });
    }
  );

  static readonly validateCreateReactionRequest: RequestHandler = (
    req,
    res,
    next
  ) => {
    req.parsedData = validateData(createReactionSchema, req.body);
    next();
  };

  static readonly createReaction: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const parsedData = {
        ...(req.parsedData! as CreateReactionType),
        userId: userId,
        postId: req.params.postId,
      };

      const postExists = await PostDatasource.postExists(parsedData.postId);
      if (!postExists) {
        throw new CustomError(404, "Post not found!");
      }

      const reactionData: ReactionAttributes = {
        userId: userId,
        postId: parsedData.postId,
        emotionType: parsedData.emotionType,
      };
      await PostDatasource.createReaction(reactionData);

      // await KafkaService.producer.send({
      //   topic: "post-reactions",
      //   messages: [
      //     {
      //       key: `${parsedData.postId}:${userId}`,
      //       value: JSON.stringify(reactionData),
      //     },
      //   ],
      // });

      successResponseHandler({
        res: res,
        status: 200,
      });
    }
  );

  static readonly validateCreateCommentRequest: RequestHandler = (
    req,
    res,
    next
  ) => {
    req.parsedData = validateData(createCommentSchema, req.body);
    next();
  };

  static readonly createComment: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const parsedData = {
        ...(req.parsedData! as CreateCommentType),
        userId: userId,
        postId: req.params.postId,
      };

      if (parsedData.level === 0 && parsedData.parentCommentId) {
        throw new CustomError(400, "parentCommentId must be null if level = 0");
      }
      if (parsedData.level > 0 && !parsedData.parentCommentId) {
        throw new CustomError(400, "parentCommentId required if level > 0");
      }

      const postExists = await PostDatasource.postExists(parsedData.postId);
      if (!postExists) {
        throw new CustomError(404, "Post not found!");
      }

      if (parsedData.level > 0) {
        const parentCommentExists = await PostDatasource.commentExists(
          parsedData.parentCommentId!,
          parsedData.level - 1,
          parsedData.postId
        );
        if (!parentCommentExists) {
          throw new CustomError(404, "Parent comment not found!");
        }
      }

      const commentData: CommentAttributes = {
        postId: parsedData.postId,
        userId: parsedData.userId,
        parentCommentId: parsedData.parentCommentId,
        level: parsedData.level,
        text: parsedData.text,
        status: EntityStatus.active,
      };
      const commentId = await PostDatasource.createComment(commentData);

      const createdCommentData = await PostDatasource.getCommentById(commentId);

      const profileImageUrl = AwsS3Service.getCloudFrontSignedUrl(
        createdCommentData.user!.profileImagePath ??
          Constants.defaultProfileImagePath
      );

      const commentDto = new FeedCommentDto({
        id: createdCommentData.id!,
        parentCommentId: createdCommentData.parentCommentId,
        text: createdCommentData.text,
        createdAt: createdCommentData.createdAt!,
        creator: {
          id: createdCommentData.user!.id!,
          firstName: createdCommentData.user!.firstName!,
          lastName: createdCommentData.user!.lastName!,
          profileImageUrl: profileImageUrl,
        },
        status: createdCommentData.status,
      });

      successResponseHandler({
        res: res,
        status: 200,
        data: commentDto,
      });
    }
  );

  static readonly getCommentsByPostId: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const getEffectiveStatus = (
        commentStatus: EntityStatus,
        userStatus: EntityStatus
      ): EntityStatus => {
        return userStatus !== EntityStatus.active
          ? EntityStatus.deleted
          : commentStatus;
      };

      const postId = req.params.postId as string | undefined | null;
      if (postId === undefined || postId === null) {
        throw new CustomError(400, "Post ID is required.");
      }

      const postExists: boolean = await PostDatasource.postExists(postId);
      if (!postExists) {
        throw new CustomError(404, "Post not found!");
      }

      const commentsData = await PostDatasource.getCommentsByPostId(postId);

      const commentDtos = commentsData.map((comment) => {
        const status = getEffectiveStatus(comment.status, comment.user!.status);
        const isActive = status === EntityStatus.active;

        const profileImageUrl = isActive
          ? AwsS3Service.getCloudFrontSignedUrl(
              comment.user!.profileImagePath ??
                Constants.defaultProfileImagePath
            )
          : null;

        return new FeedCommentDto({
          id: comment.id!,
          parentCommentId: comment.parentCommentId,
          text: isActive ? comment.text : null,
          createdAt: isActive ? comment.createdAt! : null,
          creator: isActive
            ? {
                id: comment.user!.id!,
                firstName: comment.user!.firstName!,
                lastName: comment.user!.lastName!,
                profileImageUrl: profileImageUrl!,
              }
            : null,
          status: status,
        });
      });

      const commentsTree = arrayToTree(commentDtos, {
        id: "id",
        parentId: "parentCommentId",
        childrenField: "replies",
        nestedIds: false,
        dataField: null,
      });

      successResponseHandler({
        res: res,
        status: 200,
        data: commentsTree,
      });
    }
  );

  static readonly #processFeedPosts = (
    posts: PostAttributes[]
  ): FeedPostDto[] => {
    return posts.map((post) => {
      const postImageUrl =
        post.imagePath != null
          ? AwsS3Service.getCloudFrontSignedUrl(post.imagePath)
          : null;
      const profileImageUrl = AwsS3Service.getCloudFrontSignedUrl(
        post.user!.profileImagePath ?? Constants.defaultProfileImagePath
      );

      let repostedPost: FeedPostParams | null = null;
      if (post.repostedPostId !== null) {
        const repostImageUrl =
          post.repostedPost?.imagePath != null
            ? AwsS3Service.getCloudFrontSignedUrl(post.repostedPost.imagePath)
            : null;
        const repostProfileImageUrl =
          post.repostedPost !== null
            ? AwsS3Service.getCloudFrontSignedUrl(
                post.repostedPost!.user!.profileImagePath ??
                  Constants.defaultProfileImagePath
              )
            : null;
        repostedPost = {
          id: post.repostedPost?.id ?? null,
          text: post.repostedPost?.text ?? null,
          imageUrl: repostImageUrl,
          likeCount: post.repostedPost?.likeCount ?? null,
          dislikeCount: post.repostedPost?.dislikeCount ?? null,
          commentCount: post.repostedPost?.commentCount ?? null,
          createdAt: post.repostedPost?.createdAt ?? null,
          repostedPost: null,
          creator:
            post.repostedPost !== null
              ? {
                  id: post.repostedPost!.user!.id!,
                  firstName: post.repostedPost!.user!.firstName!,
                  lastName: post.repostedPost!.user!.lastName!,
                  profileImageUrl: repostProfileImageUrl!,
                }
              : null,
          status: post.repostedPost?.status ?? EntityStatus.deleted,
        };
      }

      return new FeedPostDto({
        id: post.id!,
        text: post.text,
        imageUrl: postImageUrl,
        likeCount: post.likeCount!,
        dislikeCount: post.dislikeCount!,
        commentCount: post.commentCount!,
        createdAt: post.createdAt!,
        repostedPost: repostedPost,
        creator: {
          id: post.user!.id!,
          firstName: post.user!.firstName!,
          lastName: post.user!.lastName!,
          profileImageUrl: profileImageUrl,
        },
        status: post.status,
      });
    });
  };

  static readonly getPostsFeed: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const page = parseInt(req.query.page as string);
      if (page < 0) {
        throw new CustomError(400, "Page can not be less than zero!");
      }

      const posts = await PostDatasource.getPostsFeed(page);
      const feed = this.#processFeedPosts(posts);

      successResponseHandler({
        res: res,
        status: 200,
        data: feed,
      });
    }
  );
}
