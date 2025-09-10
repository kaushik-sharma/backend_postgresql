export interface UserCommentParams {
  id: string;
  postId: string;
  text: string;
  createdAt: Date;
}

export class UserCommentDto {
  constructor(params: UserCommentParams) {
    Object.assign(this, params);
  }
}
