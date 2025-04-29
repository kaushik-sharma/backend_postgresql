import { Platform } from "../constants/enums.js";

export interface ActiveSessionParams {
  id: string;
  deviceName: string;
  platform: Platform;
  createdAt: Date;
}

export interface ActiveSessionsOverview {
  current: ActiveSessionParams;
  others: ActiveSessionParams[];
}

export class ActiveSessionsOverviewDto {
  constructor(params: ActiveSessionsOverview) {
    Object.assign(this, params);
  }
}
