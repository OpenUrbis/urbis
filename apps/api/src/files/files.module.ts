import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import filesConfig from 'common/config/files.config';

@Module({
  imports: [ConfigModule.forFeature(filesConfig)],
  providers: [
    FilesService,
    {
      provide: S3Client,
      useFactory: (configService: ConfigService) => {
        return new S3Client({
          endpoint: configService.get('files.endpoint'),
          region: configService.get('files.awsRegion'),
          forcePathStyle: configService.get('files.endpoint') !== undefined,
          credentials: {
            accessKeyId: configService.get('files.awsAccessKeyId'),
            secretAccessKey: configService.get('files.awsSecretAccessKey'),
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  controllers: [FilesController],
})
export class FilesModule {}
