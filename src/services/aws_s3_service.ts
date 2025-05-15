import fs from "fs";
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";
import {
  CloudFrontClient,
  CreateInvalidationCommand,
  CreateInvalidationCommandInput,
} from "@aws-sdk/client-cloudfront";
import { v4 as uuidv4 } from "uuid";
import mime from "mime";
import { DateTime } from "luxon";

import { Constants } from "../constants/values.js";

export enum AwsS3FileCategory {
  profiles = "profiles",
  posts = "posts",
  static = "static",
}

export class AwsS3Service {
  static get #s3Client(): S3Client {
    return new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  static get #cloudfrontClient(): CloudFrontClient {
    return new CloudFrontClient({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  static readonly uploadFile = async (
    file: Express.Multer.File,
    category: AwsS3FileCategory
  ): Promise<string> => {
    const fileName = `${uuidv4()}.${mime.extension(file.mimetype)}`;
    const filePath = `${category}/${fileName}`;

    const params: PutObjectCommandInput = {
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: filePath,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await this.#s3Client.send(new PutObjectCommand(params));

    return filePath;
  };

  static readonly getCloudFrontSignedUrl = (filePath: string): string => {
    const privateKey = fs.readFileSync(
      process.env.CLOUDFRONT_PRIVATE_KEY_FILE_NAME!,
      "utf8"
    );
    return getSignedUrl({
      url: `${process.env.AWS_CLOUDFRONT_DOMAIN_NAME!}/${filePath}`,
      dateLessThan: DateTime.utc().plus(Constants.imageExpiryDuration).toISO(),
      privateKey: privateKey,
      keyPairId: process.env.AWS_CLOUDFRONT_KEY_PAIR_ID!,
    });
  };

  static readonly initiateDeleteFile = (fileName: string): void => {
    this.#deleteFile(fileName);
  };

  static readonly #deleteFile = async (fileName: string): Promise<void> => {
    await this.#deleteS3File(fileName);
    await this.#invalidateCloudFrontCache(fileName);
  };

  static readonly #deleteS3File = async (fileName: string): Promise<void> => {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileName,
    };
    await this.#s3Client.send(new DeleteObjectCommand(params));
  };

  static readonly #invalidateCloudFrontCache = async (
    fileName: string
  ): Promise<void> => {
    const params: CreateInvalidationCommandInput = {
      DistributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID!,
      InvalidationBatch: {
        CallerReference: fileName,
        Paths: {
          Quantity: 1,
          Items: [`/${fileName}`],
        },
      },
    };
    const command = new CreateInvalidationCommand(params);
    await this.#cloudfrontClient.send(command);
  };
}
