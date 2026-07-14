export type Job = { key: string; payload: unknown };
export type JobResult = {
  status: "processed" | "duplicate" | "failed";
  attempts: number;
};

export function createWorker(handler: (job: Job) => Promise<void>): {
  run(job: Job): Promise<JobResult>;
} {
  const completed = new Set<string>();
  const attempts = new Map<string, number>();
  return {
    async run(job) {
      if (completed.has(job.key))
        return { status: "duplicate", attempts: attempts.get(job.key) ?? 1 };
      const count = (attempts.get(job.key) ?? 0) + 1;
      attempts.set(job.key, count);
      try {
        await handler(job);
        completed.add(job.key);
        return { status: "processed", attempts: count };
      } catch {
        return { status: "failed", attempts: count };
      }
    },
  };
}
