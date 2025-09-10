export interface UserPostParams {
  id: string;
  text: string;
  imageUrl: string | null;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  createdAt: Date;
}

export class UserPostDto {
  constructor(params: UserPostParams) {
    Object.assign(this, params);
  }
}
