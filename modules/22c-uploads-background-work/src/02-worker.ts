export type Job = { key: string; payload: unknown };
export type JobResult = {
  status: "processed" | "duplicate" | "failed";
  attempts: number;
};

/** Build an in-memory at-least-once worker. The handler is injected so tests never need a queue. */
export function createWorker(_handler: (job: Job) => Promise<void>): {
  run(job: Job): Promise<JobResult>;
} {
  throw new Error(
    "TODO: remember completed keys, count attempts, and never repeat a completed side effect",
  );
}
