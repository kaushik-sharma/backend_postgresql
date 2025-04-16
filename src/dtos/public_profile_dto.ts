interface PublicProfileDtoParams {
  firstName: string;
  lastName: string;
  profileImageUrl: string;
}

export default class PublicProfileDto {
  public readonly firstName!: string;
  public readonly lastName!: string;
  public readonly profileImageUrl!: string;

  constructor(params: PublicProfileDtoParams) {
    Object.assign(this, params);
  }
}
