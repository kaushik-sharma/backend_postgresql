interface ProfileDtoParams {
  firstName: string;
  lastName: string;
  gender: string;
  countryCode: string;
  phoneNumber: string;
  email: string;
  dob: string;
  profileImageUrl: string;
}

export default class ProfileDto {
  public readonly firstName!: string;
  public readonly lastName!: string;
  public readonly gender!: string;
  public readonly countryCode!: string;
  public readonly phoneNumber!: string;
  public readonly email!: string;
  public readonly dob!: string;
  public readonly profileImageUrl!: string;

  constructor(params: ProfileDtoParams) {
    Object.assign(this, params);
  }
}
