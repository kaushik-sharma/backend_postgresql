import { subYears } from "date-fns";

export class DateUtils {
  static readonly subtractYearsFromDate = (date: Date, years: number): Date => {
    return subYears(date, years);
  };
}
