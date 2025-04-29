import { EntityStatus } from "../constants/enums.js";

export interface CommentCreatorParams {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
}

export interface FeedCommentParams {
  id: string;
  parentCommentId: string | null;
  text: string | null;
  createdAt: Date | null;
  creator: CommentCreatorParams | null;
  status: EntityStatus;
}

export class FeedCommentDto {
  constructor(params: FeedCommentParams) {
    Object.assign(this, params);
  }
}
