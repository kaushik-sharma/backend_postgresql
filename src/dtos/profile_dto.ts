export interface ProfileParams {
  firstName: string;
  lastName: string;
  gender: string;
  countryCode: string;
  phoneNumber: string;
  email: string;
  dob: string;
  profileImageUrl: string;
}

export class ProfileDto {
  constructor(params: ProfileParams) {
    Object.assign(this, params);
  }
}
