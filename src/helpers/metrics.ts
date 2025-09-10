import { RedisService } from "../services/redis-service.js";

function _sortRecordByValueDesc(
  input: Record<string, number>
): Record<string, number> {
  const sortedEntries = Object.entries(input).sort(
    (a, b) => Number(b[1]) - Number(a[1])
  );
  return Object.fromEntries(sortedEntries);
}

export const getAggregatedHitsCount = async () => {
  const data: Record<string, any> = {};
  const stream = RedisService.client.scanStream({
    match: "hits:*",
    count: 100,
  });

  const execPromises: Promise<void>[] = [];

  await new Promise<void>((resolve, reject) => {
    stream.on("data", (keys: string[]) => {
      if (keys.length > 0) {
        const pipeline = RedisService.client.pipeline();
        keys.forEach((k) => pipeline.get(k));
        // Push a promise that resolves when this pipeline finishes
        const promise = pipeline.exec().then((responses) => {
          keys.forEach((k, i) => {
            const [err, result] = responses![i];
            if (!err) {
              data[k] = result;
            }
          });
        });
        execPromises.push(promise);
      }
    });

    stream.on("end", () => {
      // Wait for all pending pipelines to finish
      Promise.all(execPromises)
        .then(() => resolve())
        .catch(reject);
    });

    stream.on("error", (err) => reject(err));
  });

  const sortedData = _sortRecordByValueDesc(data);
  console.log(sortedData);
};
