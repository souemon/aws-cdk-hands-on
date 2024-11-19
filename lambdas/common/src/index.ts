import { S3Handler, S3Event } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import jimp from "jimp";

export async function getImageFromS3(
  s3Client: S3Client,
  bucketName: string,
  key: string
) {
  const input: GetObjectCommandInput = {
    Bucket: bucketName,
    Key: key,
  };
  console.log(`downloading an object from: s3://${bucketName}/${key}`);
  const command = new GetObjectCommand(input);
  const result = await s3Client.send(command);
  if (!result.Body) {
    throw Error("result.Body is undefined");
  }
  const body = await result.Body.transformToByteArray();

  console.log(body);

  // 2. resize an image
  const bodyBuffer = Buffer.from(body);
  const image = await jimp.read(bodyBuffer);

  return image;
}
export async function putImageToS3(
  s3Client: S3Client,
  bucketName: string,
  key: string,
  imageBuffer: Buffer
) {
  const putInput: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: key,
    Body: imageBuffer,
  };
  console.log(`uploading an object to: s3://${bucketName}/${key}`);
  const putCommand = new PutObjectCommand(putInput);
  const uploadResult = await s3Client.send(putCommand);
  console.log(uploadResult);

  return uploadResult;
}
