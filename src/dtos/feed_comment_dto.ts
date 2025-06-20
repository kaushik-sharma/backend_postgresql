import { EntityStatus } from "../generated/prisma/index.js";
import { CreatorParams } from "./feed_post_dto.js";

export interface FeedCommentParams {
  id: string;
  parentCommentId: string | null;
  text: string | null;
  createdAt: Date | null;
  creator: CreatorParams | null;
  status: EntityStatus;
}

export class FeedCommentDto {
  constructor(params: FeedCommentParams) {
    Object.assign(this, params);
  }
}
