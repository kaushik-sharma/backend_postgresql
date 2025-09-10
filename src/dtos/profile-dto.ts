export interface ProfileParams {
  firstName: string;
  lastName: string;
  gender: string;
  countryCode: string;
  phoneNumber: string;
  email: string;
  dob: string;
  profileImageUrl: string;
  followerCount: number;
  followeeCount: number;
}

export class ProfileDto {
  constructor(params: ProfileParams) {
    Object.assign(this, params);
  }
}

export interface PublicProfileParams {
  firstName: string;
  lastName: string;
  profileImageUrl: string;
  followerCount: number;
  followeeCount: number;
  isFollowee: boolean;
}

export class PublicProfileDto {
  constructor(params: PublicProfileParams) {
    Object.assign(this, params);
  }
}
