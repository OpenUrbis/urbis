import 'reflect-metadata';
import { SetMetadata } from '@nestjs/common';

export interface WorkerMetadata {
  name: string;
  description?: string;
  path?: string;
  isRoot?: boolean;
  excludedPaths?: string[];
}

export const WORKER_METADATA_KEY = 'worker_metadata';

export function Worker(metadata: WorkerMetadata): ClassDecorator {
  return (target) => {
    SetMetadata(WORKER_METADATA_KEY, metadata)(target);
  };
}
