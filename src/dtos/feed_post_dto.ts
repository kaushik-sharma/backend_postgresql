import { EntityStatus } from "../constants/enums.js";

interface PostCreatorParams {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
}

interface FeedPostDtoParams {
  id: string | null;
  text: string | null;
  imageUrl: string | null;
  likeCount: number | null;
  dislikeCount: number | null;
  commentCount: number | null;
  createdAt: Date | null;
  repostedPost: FeedPostDtoParams | null;
  creator: PostCreatorParams | null;
  status: EntityStatus;
}

export default class FeedPostDto {
  public readonly id!: string | null;
  public readonly text!: string | null;
  public readonly imageUrl!: string | null;
  public readonly likeCount!: number | null;
  public readonly dislikeCount!: number | null;
  public readonly commentCount!: number | null;
  public readonly createdAt!: Date | null;
  public readonly repostedPost!: FeedPostDtoParams | null;
  public readonly creator!: PostCreatorParams | null;
  public readonly status!: EntityStatus;

  constructor(params: FeedPostDtoParams) {
    Object.assign(this, params);
  }
}
