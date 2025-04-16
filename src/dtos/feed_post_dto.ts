interface PostCreatorParams {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
}

interface FeedPostDtoParams {
  id: string;
  text: string;
  imageUrl: string | null;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  createdAt: Date;
  repostedPost: FeedPostDtoParams | null;
  creator: PostCreatorParams;
}

export default class FeedPostDto {
  public readonly id!: string;
  public readonly text!: string;
  public readonly imageUrl!: string | null;
  public readonly likeCount!: number;
  public readonly dislikeCount!: number;
  public readonly commentCount!: number;
  public readonly createdAt!: Date;
  public readonly repostedPost!: FeedPostDtoParams | null;
  public readonly creator!: PostCreatorParams;

  constructor(params: FeedPostDtoParams) {
    Object.assign(this, params);
  }
}
