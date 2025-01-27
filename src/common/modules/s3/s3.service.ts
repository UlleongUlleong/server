import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Express } from 'express';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private readonly bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
      },
    });

    this.bucketName = process.env.AWS_S3_BUCKET_NAME;
  }

  async uploadFile(
    file: Express.Multer.File,
    userId?: number,
  ): Promise<string> {
    console.log('s3', file, userId);
    const uploadParams = {
      Bucket: this.bucketName,
      Key: `profile-images/${userId}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      const command = new PutObjectCommand(uploadParams);
      await this.s3Client.send(command);

      return `https://${this.bucketName}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/profile-images/${userId}`;
    } catch {
      throw new InternalServerErrorException('프로필 사진진 업로드 실패');
    }
  }

  async deleteFile(userId: number): Promise<void> {
    const deletePrams = {
      Bucket: this.bucketName,
      Key: `profile-images/${userId}`,
    };

    try {
      const commeand = new DeleteObjectCommand(deletePrams);
      await this.s3Client.send(commeand);
      return;
    } catch {
      throw new InternalServerErrorException('프로필 사진 삭제 실패');
    }
  }
}
