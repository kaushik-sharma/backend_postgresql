import { RequestHandler } from "express";
import { arrayToTree } from "performant-array-to-tree";

import { validateModel } from "../helpers/validation_helper.js";
import {
  createCommentSchema,
  CreateCommentType,
  createPostSchema,
  CreatePostType,
  createReactionSchema,
  CreateReactionType,
} from "../validation/post_schema.js";
import { asyncHandler } from "../helpers/async_handler.js";
import PostDatasource from "../datasources/post_datasource.js";
import { CustomError } from "../middlewares/error_middlewares.js";
import AwsS3Service, { AwsS3FileCategory } from "../services/aws_s3_service.js";
import { PostModel } from "../models/post/post_model.js";
import { EntityStatus } from "../constants/enums.js";
import SocketManager from "../socket.js";
import { successResponseHandler } from "../helpers/success_handler.js";
import { ReactionModel } from "../models/post/reaction_model.js";
import { CommentModel } from "../models/post/comment_model.js";
import { DEFAULT_PROFILE_IMAGE_PATH } from "../constants/values.js";
import ProfileDatasource from "../datasources/profile_datasource.js";
import FeedCommentDto from "../dtos/feed_comment_dto.js";
import UserCommentDto from "../dtos/user_comment_dto.js";
import FeedPostDto from "../dtos/feed_post_dto.js";
import UserPostDto from "../dtos/user_post_dto.js";

export default class PostController {
  static readonly validateCreatePostRequest: RequestHandler = (
    req,
    res,
    next
  ) => {
    req.parsedData = validateModel(createPostSchema, req.body);
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

      const post = new PostModel({
        userId: userId,
        text: parsedData.text,
        imagePath: imagePath,
        repostedPostId: parsedData.repostedPostId,
        status: EntityStatus.active,
      });
      await PostDatasource.createPost(post);

      SocketManager.io.emit("newPostsAvailable", {
        message: "New posts added. Refresh the feed.",
      });

      const user = await ProfileDatasource.getPublicUserById(userId);
      const profileImageUrl = AwsS3Service.getCloudFrontSignedUrl(
        user.profileImagePath ?? DEFAULT_PROFILE_IMAGE_PATH
      );

      let repostedPostDto: FeedPostDto | null = null;
      if (parsedData.repostedPostId !== undefined) {
        const repostedPost = await PostDatasource.getPostById(
          parsedData.repostedPostId
        );
        const imageUrl =
          repostedPost.imagePath !== null
            ? AwsS3Service.getCloudFrontSignedUrl(repostedPost.imagePath)
            : null;
        const profileImageUrl = AwsS3Service.getCloudFrontSignedUrl(
          repostedPost.user.profileImagePath ?? DEFAULT_PROFILE_IMAGE_PATH
        );

        repostedPostDto = new FeedPostDto({
          id: repostedPost.id,
          text: repostedPost.text,
          imageUrl: imageUrl,
          likeCount: repostedPost.likeCount,
          dislikeCount: repostedPost.dislikeCount,
          commentCount: repostedPost.commentCount,
          createdAt: repostedPost.createdAt,
          repostedPost: null,
          creator: {
            id: repostedPost.user.id,
            firstName: repostedPost.user.firstName!,
            lastName: repostedPost.user.lastName!,
            profileImageUrl: profileImageUrl,
          },
          status: repostedPost.status,
        });
      }

      const createdPost = new FeedPostDto({
        id: post.id,
        text: post.text,
        imageUrl: imageUrl,
        likeCount: 0,
        dislikeCount: 0,
        commentCount: 0,
        createdAt: post.createdAt,
        repostedPost: repostedPostDto,
        creator: {
          id: userId,
          firstName: user.firstName!,
          lastName: user.lastName!,
          profileImageUrl: profileImageUrl,
        },
        status: post.status,
      });

      successResponseHandler({
        res: res,
        status: 200,
        data: createdPost,
      });
    }
  );

  static readonly validateCreateReactionRequest: RequestHandler = (
    req,
    res,
    next
  ) => {
    req.parsedData = validateModel(createReactionSchema, req.body);
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

      const postExists: boolean = await PostDatasource.postExists(
        parsedData.postId
      );
      if (!postExists) {
        throw new CustomError(404, "Post not found!");
      }

      const reaction = new ReactionModel({
        userId: parsedData.userId,
        postId: parsedData.postId,
        emotionType: parsedData.emotionType,
      });
      await PostDatasource.createReaction(reaction);

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
    req.parsedData = validateModel(createCommentSchema, req.body);
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

      if (
        parsedData.level === 0 &&
        parsedData.parentCommentId !== undefined &&
        parsedData.parentCommentId !== null
      ) {
        throw new CustomError(400, "parentCommentId must be null if level = 0");
      }
      if (
        parsedData.level > 0 &&
        (parsedData.parentCommentId === undefined ||
          parsedData.parentCommentId === null)
      ) {
        throw new CustomError(400, "parentCommentId required if level > 0");
      }

      const postExists: boolean = await PostDatasource.postExists(
        parsedData.postId
      );
      if (!postExists) {
        throw new CustomError(404, "Post not found!");
      }

      if (parsedData.level > 0) {
        const parentCommentExists: boolean = await PostDatasource.commentExists(
          parsedData.parentCommentId!,
          parsedData.level - 1,
          parsedData.postId
        );
        if (!parentCommentExists) {
          throw new CustomError(404, "Parent comment not found!");
        }
      }

      const comment = new CommentModel({
        postId: parsedData.postId,
        userId: parsedData.userId,
        parentCommentId: parsedData.parentCommentId,
        level: parsedData.level,
        text: parsedData.text,
        status: EntityStatus.active,
      });
      const commentId = await PostDatasource.createComment(comment);

      const createdComment = await PostDatasource.getCommentById(commentId);
      const profileImageUrl = AwsS3Service.getCloudFrontSignedUrl(
        createdComment.user.profileImagePath ?? DEFAULT_PROFILE_IMAGE_PATH
      );

      const commentDto = new FeedCommentDto({
        id: createdComment.id,
        parentCommentId: createdComment.parentCommentId,
        text: createdComment.text,
        createdAt: createdComment.createdAt,
        creator: {
          id: createdComment.user.id,
          firstName: createdComment.user.firstName!,
          lastName: createdComment.user.lastName!,
          profileImageUrl: profileImageUrl,
        },
        status: createdComment.status,
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

      const comments = await PostDatasource.getCommentsByPostId(postId);

      const filteredComments = comments.map((comment) => {
        const status = getEffectiveStatus(comment.status, comment.user.status);
        const isActive = status === EntityStatus.active;

        const profileImageUrl = isActive
          ? AwsS3Service.getCloudFrontSignedUrl(
              comment.user.profileImagePath ?? DEFAULT_PROFILE_IMAGE_PATH
            )
          : null;

        return new FeedCommentDto({
          id: comment.id,
          parentCommentId: comment.parentCommentId,
          text: isActive ? comment.text : null,
          createdAt: isActive ? comment.createdAt : null,
          creator: isActive
            ? {
                id: comment.user.id,
                firstName: comment.user.firstName!,
                lastName: comment.user.lastName!,
                profileImageUrl: profileImageUrl!,
              }
            : null,
          status: status,
        });
      });

      const commentsTree = arrayToTree(filteredComments, {
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

  static readonly getUserComments: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const page = parseInt(req.params.page);
      if (page < 0) {
        throw new CustomError(400, "Page can not be less than zero!");
      }

      const comments = await PostDatasource.getCommentsByUserId(userId, page);

      const filteredComments = comments.map((comment) => {
        return new UserCommentDto({
          id: comment.id,
          postId: comment.postId,
          text: comment.text,
          createdAt: comment.createdAt,
        });
      });

      successResponseHandler({
        res: res,
        status: 200,
        data: filteredComments,
      });
    }
  );

  static readonly deletePost: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const postId = req.params.postId as string | undefined | null;
      if (postId === undefined || postId === null) {
        throw new CustomError(400, "Post ID is required.");
      }

      const postExists: boolean = await PostDatasource.postExists(postId);
      if (!postExists) {
        throw new CustomError(404, "Post not found!");
      }

      const postUserId: string = await PostDatasource.getPostUserId(postId);
      if (postUserId !== userId) {
        throw new CustomError(403, "Can not delete other users' posts!");
      }

      // Delete the post image if it exists from S3 & CloudFront
      const imagePath: string | null = await PostDatasource.getPostImagePath(
        postId
      );
      if (imagePath !== null) {
        AwsS3Service.initiateDeleteFile(imagePath);
      }

      await PostDatasource.deletePost(postId, userId);

      successResponseHandler({
        res: res,
        status: 200,
      });
    }
  );

  static readonly deleteComment: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const commentId = req.params.commentId as string | undefined | null;
      if (commentId === undefined || commentId === null) {
        throw new CustomError(400, "Comment ID is required.");
      }

      const commentExists: boolean = await PostDatasource.commentExists(
        commentId
      );
      if (!commentExists) {
        throw new CustomError(404, "Comment not found!");
      }

      const commentUserId: string = await PostDatasource.getCommentUserId(
        commentId
      );
      if (commentUserId !== userId) {
        throw new CustomError(403, "Can not delete other users' comments!");
      }

      await PostDatasource.deleteComment(commentId, userId);

      successResponseHandler({
        res: res,
        status: 200,
      });
    }
  );

  static readonly #processFeedPosts = (posts: PostModel[]): FeedPostDto[] => {
    return posts.map((post) => {
      const postImageUrl =
        post.imagePath != null
          ? AwsS3Service.getCloudFrontSignedUrl(post.imagePath)
          : null;
      const profileImageUrl = AwsS3Service.getCloudFrontSignedUrl(
        post.user.profileImagePath ?? DEFAULT_PROFILE_IMAGE_PATH
      );

      let repostedPost: FeedPostDto | null = null;
      if (post.repostedPostId !== null) {
        const repostImageUrl =
          post.repostedPost?.imagePath != null
            ? AwsS3Service.getCloudFrontSignedUrl(post.repostedPost.imagePath)
            : null;
        const repostProfileImageUrl =
          post.repostedPost !== null
            ? AwsS3Service.getCloudFrontSignedUrl(
                post.repostedPost!.user.profileImagePath ??
                  DEFAULT_PROFILE_IMAGE_PATH
              )
            : null;
        repostedPost = new FeedPostDto({
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
                  id: post.repostedPost!.user.id,
                  firstName: post.repostedPost!.user.firstName!,
                  lastName: post.repostedPost!.user.lastName!,
                  profileImageUrl: repostProfileImageUrl!,
                }
              : null,
          status: post.repostedPost?.status ?? EntityStatus.deleted,
        });
      }

      return new FeedPostDto({
        id: post.id,
        text: post.text,
        imageUrl: postImageUrl,
        likeCount: post.likeCount,
        dislikeCount: post.dislikeCount,
        commentCount: post.commentCount,
        createdAt: post.createdAt,
        repostedPost: repostedPost,
        creator: {
          id: post.user.id,
          firstName: post.user.firstName!,
          lastName: post.user.lastName!,
          profileImageUrl: profileImageUrl,
        },
        status: post.status,
      });
    });
  };

  static readonly #processUserPosts = (posts: PostModel[]): UserPostDto[] => {
    return posts.map((post) => {
      const postImageUrl =
        post.imagePath != null
          ? AwsS3Service.getCloudFrontSignedUrl(post.imagePath)
          : null;

      return new UserPostDto({
        id: post.id,
        text: post.text,
        imageUrl: postImageUrl,
        likeCount: post.likeCount,
        dislikeCount: post.dislikeCount,
        commentCount: post.commentCount,
        createdAt: post.createdAt,
      });
    });
  };

  static readonly getPostsFeed: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const page = parseInt(req.params.page);
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

  static readonly getUserPosts: RequestHandler = asyncHandler(
    async (req, res, next) => {
      const userId = req.user!.userId;

      const page = parseInt(req.params.page);
      if (page < 0) {
        throw new CustomError(400, "Page can not be less than zero!");
      }

      const posts = await PostDatasource.getPostsByUserId(userId, page);
      const feed = this.#processUserPosts(posts);

      successResponseHandler({
        res: res,
        status: 200,
        data: feed,
      });
    }
  );
}
