import { EntityStatus } from "../constants/enums.js";

export interface PostCreatorParams {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
}

export interface FeedPostParams {
  id: string | null;
  text: string | null;
  imageUrl: string | null;
  likeCount: number | null;
  dislikeCount: number | null;
  commentCount: number | null;
  createdAt: Date | null;
  repostedPost: FeedPostParams | null;
  creator: PostCreatorParams | null;
  status: EntityStatus;
}

export class FeedPostDto {
  constructor(params: FeedPostParams) {
    Object.assign(this, params);
  }
}
