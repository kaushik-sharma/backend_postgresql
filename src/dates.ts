// import { DateTime, Duration, Interval } from "luxon";

// const now = DateTime.now();
// console.log(now.toISO());

// const nowLocal = DateTime.local();
// console.log(nowLocal.toISO());

// const nowUtc = DateTime.utc();
// console.log(nowUtc.toISO());

// const jsDate = new Date(2025, 3, 24, 2, 13);
// const fromJSDate = DateTime.fromJSDate(jsDate);
// console.log(fromJSDate.toISO());

// const lxLocalDate = DateTime.local(2025, 10, 21, 6, 23, 10, 456);
// console.log(lxLocalDate.toISO());

// const lxUTCDate = DateTime.utc(2025, 10, 21, 6, 23, 10, 456);
// console.log(lxUTCDate.toISO());

// const localMillisSinceEpoch = DateTime.local().toMillis();
// const utcMillisSinceEpoch = DateTime.utc().toMillis();
// console.log(localMillisSinceEpoch);
// console.log(utcMillisSinceEpoch);
// console.log(localMillisSinceEpoch === utcMillisSinceEpoch);
// const millisSinceEpochDateTime = DateTime.fromMillis(localMillisSinceEpoch);
// console.log(millisSinceEpochDateTime.toISO());
// console.log(millisSinceEpochDateTime.toUTC().toISO());

// const fromObject = DateTime.fromObject(
//   {
//     year: 2020,
//   },
//   { zone: "utc" }
// );
// console.log(fromObject.toISO());

// const badDate = DateTime.fromISO("not-a-date");
// console.log(badDate.toISO());
// console.log(badDate.isValid);
// console.log(badDate.invalidReason);
// console.log(badDate.invalidExplanation);

// const sample = DateTime.utc();
// console.log(
//   sample.year,
//   sample.month,
//   sample.day,
//   sample.hour,
//   sample.minute,
//   sample.second,
//   sample.millisecond
// );

// const febLast = DateTime.local(2025, 2, 28);
// console.log(febLast.toISO());
// const plus2Days = febLast.plus({ days: 2 });
// console.log(plus2Days.toISO());

// const yearLast = DateTime.local(2025, 12, 31);
// console.log(yearLast.toISO());
// const plus5Days = yearLast.plus({ days: 5 });
// console.log(plus5Days.toISO());

// console.log(now.startOf("week").toISO());
// console.log(now.endOf("month").toISO());

// const date1 = DateTime.local(2025, 4, 20, 12, 10, 34);
// const date2 = DateTime.local(2025, 4, 22, 12, 10, 34);

// console.log(date1 < date2, date1 > date2, date1.equals(date2));

// const difference = date2.diff(date1);
// console.log(difference.as("days"));

// const dur1 = Duration.fromObject({ days: 2 });
// console.log(dur1.as("hours"));

// const start = DateTime.local(2025, 2, 1);
// const end = DateTime.local(2025, 3, 1);
// const interval = Interval.fromDateTimes(start, end);
// console.log(interval.length("days"));
// console.log(interval.splitBy({ weeks: 1 }));
