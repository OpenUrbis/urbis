export type JobStatus = "processing" | "completed" | "failed";

export interface JobResponse {
  jobId: string;
}

export interface JobStatusResponse {
  status: JobStatus;
  data?: any;
}

const jobs = new Map<string, { startTime: number }>();

export const uploadAndProcessDwg = async (file: File): Promise<JobResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const jobId = Math.random().toString(36).substring(7);
      jobs.set(jobId, { startTime: Date.now() });
      resolve({ jobId });
    }, 1500); // Simulate network upload time
  });
};

export const checkJobStatus = async (
  jobId: string,
): Promise<JobStatusResponse> => {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const job = jobs.get(jobId);
      if (!job) {
        resolve({ status: "failed" });
        return;
      }

      // Simulate a processing time of 15 seconds (so it polls at least once or twice)
      const elapsed = Date.now() - job.startTime;
      if (elapsed < 15000) {
        resolve({ status: "processing" });
        return;
      }

      try {
        // Fetch the mock data
        const response = await fetch("/novojson.json");
        const data = await response.json();
        resolve({ status: "completed", data });
      } catch (error) {
        console.error("Failed to fetch mock JSON:", error);
        resolve({ status: "failed" });
      }
    }, 500);
  });
};
