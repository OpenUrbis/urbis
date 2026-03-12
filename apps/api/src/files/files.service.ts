import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  constructor(
    @Inject(S3Client) private readonly s3: S3Client,
    private readonly configService: ConfigService,
  ) {}

  async getUploadUrl(
    contentType: string,
  ): Promise<{ uploadURL: string; key: string }> {
    const bucketName = this.configService.get('S3_BUCKET_NAME');
    const extension = mime.extension(contentType);
    if (!extension) {
      throw new Error('Content type inválido');
    }
    const uuid = uuidv4();
    const key = `uploads/${uuid}.${extension}`;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });
    const uploadURL = await getSignedUrl(this.s3, command);
    return { uploadURL, key };
  }

  async getDownloadUrl(key: string): Promise<{ downloadURL: string }> {
    const bucketName = this.configService.get('S3_BUCKET_NAME');
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const downloadURL = await getSignedUrl(this.s3, command);
    return { downloadURL };
  }
}
