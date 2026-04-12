import { registerAs } from '@nestjs/config';

export default registerAs('aws', () => ({
  accessKey: process.env.AWS_ACCESS_KEY || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  s3: {
    region: process.env.AWS_S3_REGION || 'us-east-1',
    endpoint: process.env.AWS_S3_ENDPOINT || undefined,
    publicBucket: process.env.AWS_S3_PUBLIC_BUCKET || '',
    privateBucket: process.env.AWS_S3_PRIVATE_BUCKET || '',
  },
}));
