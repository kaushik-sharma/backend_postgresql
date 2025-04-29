export interface PublicProfileParams {
  firstName: string;
  lastName: string;
  profileImageUrl: string;
}

export class PublicProfileDto {
  constructor(params: PublicProfileParams) {
    Object.assign(this, params);
  }
}
