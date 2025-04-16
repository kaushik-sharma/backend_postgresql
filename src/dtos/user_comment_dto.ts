interface UserCommentDtoParams {
  id: string;
  postId: string;
  text: string;
  createdAt: Date;
}

export default class UserCommentDto {
  public readonly id!: string;
  public readonly postId!: string;
  public readonly text!: string;
  public readonly createdAt!: Date;

  constructor(params: UserCommentDtoParams) {
    Object.assign(this, params);
  }
}
