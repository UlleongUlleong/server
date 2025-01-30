import { BadRequestException, Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

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

  async uploadFile(file: Express.Multer.File): Promise<string> {
    console.log(file.originalname);
    const fileExtension = path.extname(file.originalname);
    const fileName = uuidv4() + fileExtension;
    const allowedMimeTypes = ['image/png', 'image/jpeg'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('잘못된 파일 형식입니다.');
    }

    const uploadParams = {
      Bucket: this.bucketName,
      Key: `profile-images/${fileName}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    const command = new PutObjectCommand(uploadParams);
    await this.s3Client.send(command);

    return `/profile-images/${fileName}`;
  }

  async deleteFile(imageUrl: string): Promise<void> {
    const deletePrams = {
      Bucket: this.bucketName,
      Key: imageUrl,
    };

    const commeand = new DeleteObjectCommand(deletePrams);
    await this.s3Client.send(commeand);
    return;
  }
}
