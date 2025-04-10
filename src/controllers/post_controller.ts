import { RequestHandler } from "express";
import { arrayToTree } from "performant-array-to-tree";

import { validateModel } from "../helpers/validation_helpers.js";
import { successResponseHandler } from "../helpers/custom_handlers.js";
import { PostModel, PostType } from "../models/post/post_model.js";
import PostDatasource from "../datasources/post_datasource.js";
import { ReactionModel, ReactionType } from "../models/post/reaction_model.js";
import { CommentModel, CommentType } from "../models/post/comment_model.js";
import AwsS3Service, { AwsS3FileCategory } from "../services/aws_s3_service.js";
import { asyncHandler } from "../helpers/exception_handlers.js";
import { CustomError } from "../middlewares/error_middlewares.js";
import SocketManager from "../socket.js";

export const validateCreatePostRequest: RequestHandler = (req, res, next) => {
  const reqBody: Record<string, any> = {
    ...req.body,
    userId: req.user!.userId,
  };
  const post = new PostModel(reqBody as PostType);
  validateModel(post);
  next();
};

export const createPost: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const userId = req.user!.userId;

    const reqBody: Record<string, any> = {
      ...req.body,
      userId: userId,
    };

    const post = new PostModel(reqBody as PostType);

    if (post.repostedPostId !== null) {
      const postExists: boolean = await PostDatasource.postExists(
        post.repostedPostId!.toString()
      );
      if (!postExists) {
        throw new CustomError(404, "Reposted post not found!");
      }
    }

    let imagePath: string | null = null;
    const imageFile = req.file as Express.Multer.File | undefined;
    if (imageFile !== undefined) {
      imagePath = await AwsS3Service.uploadFile(
        imageFile,
        AwsS3FileCategory.posts
      );
    }

    const postData: Record<string, any> = (post as Record<string, any>)["_doc"];

    const newPost = new PostModel({
      ...postData,
      imagePath: imagePath,
    });

    validateModel(newPost);

    await PostDatasource.createPost(newPost);

    SocketManager.io.emit("newPostsAvailable", {
      message: "New posts added. Refresh the feed.",
    });

    successResponseHandler({
      res: res,
      status: 200,
    });
  }
);

export const validateCreateReactionRequest: RequestHandler = (
  req,
  res,
  next
) => {
  const reqBody: Record<string, any> = {
    ...req.body,
    postId: req.params.postId,
    userId: req.user!.userId,
  };
  const reaction = new ReactionModel(reqBody as ReactionType);
  validateModel(reaction);
  next();
};

export const createReaction: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const userId = req.user!.userId;

    const reqBody: Record<string, any> = {
      ...req.body,
      postId: req.params.postId,
      userId: userId,
    };

    const reaction = new ReactionModel(reqBody as ReactionType);

    const postExists: boolean = await PostDatasource.postExists(
      req.params.postId
    );
    if (!postExists) {
      throw new CustomError(404, "Post not found!");
    }

    await PostDatasource.createReaction(reaction);

    successResponseHandler({
      res: res,
      status: 200,
    });
  }
);

export const validateCreateCommentRequest: RequestHandler = (
  req,
  res,
  next
) => {
  const reqBody: Record<string, any> = {
    ...req.body,
    postId: req.params.postId,
    userId: req.user!.userId,
  };
  const comment = new CommentModel(reqBody as CommentType);
  validateModel(comment);
  next();
};

export const createComment: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const userId = req.user!.userId;

    const reqBody: Record<string, any> = {
      ...req.body,
      postId: req.params.postId,
      userId: userId,
    };

    const comment = new CommentModel(reqBody as CommentType);

    if (
      comment.level === 0 &&
      comment.parentCommentId !== undefined &&
      comment.parentCommentId !== null
    ) {
      throw new CustomError(400, "parentCommentId must be null if level = 0");
    }
    if (
      comment.level > 0 &&
      (comment.parentCommentId === undefined ||
        comment.parentCommentId === null)
    ) {
      throw new CustomError(400, "parentCommentId required if level > 0");
    }

    const postExists: boolean = await PostDatasource.postExists(
      comment.postId.toString()
    );
    if (!postExists) {
      throw new CustomError(404, "Post not found!");
    }

    if (comment.level > 0) {
      const parentCommentExists: boolean = await PostDatasource.commentExists(
        comment.parentCommentId!.toString(),
        comment.level - 1,
        comment.postId.toString()
      );
      if (!parentCommentExists) {
        throw new CustomError(404, "Parent comment not found!");
      }
    }

    await PostDatasource.createComment(comment);

    successResponseHandler({
      res: res,
      status: 200,
    });
  }
);

export const getCommentsByPostId: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const postId = req.params.postId as string | undefined | null;
    if (postId === undefined || postId === null) {
      throw new CustomError(400, "Post ID is required.");
    }

    const postExists: boolean = await PostDatasource.postExists(postId);
    if (!postExists) {
      throw new CustomError(404, "Post not found!");
    }

    const comments = await PostDatasource.getCommentsByPostId(postId);

    const commentsTree = arrayToTree(JSON.parse(JSON.stringify(comments)), {
      id: "_id",
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

export const getUserPosts: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const userId = req.user!.userId;

    const page = parseInt(req.params.page);

    const posts = await PostDatasource.getPostsByUserId(userId, page);

    successResponseHandler({
      res: res,
      status: 200,
      data: posts,
    });
  }
);

export const getUserComments: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const userId = req.user!.userId;

    const page = parseInt(req.params.page);

    const comments = await PostDatasource.getCommentsByUserId(userId, page);

    successResponseHandler({
      res: res,
      status: 200,
      data: comments,
    });
  }
);

export const deletePost: RequestHandler = asyncHandler(
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

    /// Delete the post image if it exists from S3 & Cloudfront
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

export const deleteComment: RequestHandler = asyncHandler(
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

export const getPostsFeed: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const page = parseInt(req.params.page);
    const posts = await PostDatasource.getPostsFeed(page);

    successResponseHandler({
      res: res,
      status: 200,
      data: posts,
    });
  }
);
