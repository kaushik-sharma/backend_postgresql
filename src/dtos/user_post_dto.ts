interface UserPostDtoParams {
  id: string;
  text: string;
  imageUrl: string | null;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  createdAt: Date;
}

export default class UserPostDto {
  public readonly id!: string;
  public readonly text!: string;
  public readonly imageUrl!: string | null;
  public readonly likeCount!: number;
  public readonly dislikeCount!: number;
  public readonly commentCount!: number;
  public readonly createdAt!: Date;

  constructor(params: UserPostDtoParams) {
    Object.assign(this, params);
  }
}
