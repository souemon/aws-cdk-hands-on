import { S3Handler, S3Event } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import jimp from "jimp";
import path from "path";

const DIRECTORY = "resize";

export const handler: S3Handler = async (event: S3Event) => {
  const s3Client = new S3Client();
  for (const record of event.Records) {
    // 1. download an object from S3
    const bucketName = record.s3.bucket.name;
    const key = record.s3.object.key;
    const parsedKey = path.parse(key);

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

    const width = image.getWidth();
    const height = image.getHeight();
    console.log(`original size: (${width}, ${height})`);

    const resizedWidth = Math.floor(width / 2);
    const resizedHeight = Math.floor(height / 2);
    console.log(`resize: (${resizedWidth}, ${resizedHeight})`);

    image.resize(resizedWidth, resizedHeight);

    // 3. upload an object to S3
    const mime = image.getMIME();

    const imageBuffer = await image.getBufferAsync(mime);

    const uploadKey = `${DIRECTORY}/${parsedKey.name}-resize${parsedKey.ext}`;
    const putInput: PutObjectCommandInput = {
      Bucket: bucketName,
      Key: uploadKey,
      Body: imageBuffer,
    };
    console.log(`uploading an object to: s3://${bucketName}/${uploadKey}`);
    const putCommand = new PutObjectCommand(putInput);
    const uploadResult = await s3Client.send(putCommand);
    console.log(uploadResult);
  }
};
