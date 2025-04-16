import { EntityStatus } from "../constants/enums.js";

interface CommentCreatorParams {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
}

interface FeedCommentDtoParams {
  id: string;
  parentCommentId: string | null;
  text: string | null;
  createdAt: Date | null;
  creator: CommentCreatorParams | null;
  status: EntityStatus;
}

export default class FeedCommentDto {
  public readonly id!: string;
  public readonly parentCommentId!: string | null;
  public readonly text!: string | null;
  public readonly createdAt!: Date | null;
  public readonly creator!: CommentCreatorParams | null;
  public readonly status!: EntityStatus;

  constructor(params: FeedCommentDtoParams) {
    Object.assign(this, params);
  }
}
