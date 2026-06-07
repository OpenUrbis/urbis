import { registerAs } from '@nestjs/config';

export default registerAs('files', () => ({
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_S3_ENDPOINT || undefined,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  s3BucketName: process.env.S3_BUCKET_NAME || '',
}));
