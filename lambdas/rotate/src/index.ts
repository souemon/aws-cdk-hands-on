import { SQSHandler, SQSEvent } from "aws-lambda";
import { S3Client } from "@aws-sdk/client-s3";
import { getImageFromS3, putImageToS3 } from "../../common/src/index";
import { S3Message } from "../../common/src/types";
import path from "path";

const PROCESS = "rotate";

export const handler: SQSHandler = async (event: SQSEvent) => {
  console.log(JSON.stringify(event, null, 2));

  const s3Client = new S3Client();
  for (const record of event.Records) {
    // 1. download an object from S3
    const message = record.body;
    const s3Message: S3Message = JSON.parse(message);

    const bucketName = s3Message.bucketName;
    const key = s3Message.key;
    const parsedKey = path.parse(key);

    const image = await getImageFromS3(s3Client, bucketName, key);

    // 2. process the image
    const degree = 5;
    console.log(`${PROCESS} the image: ${key}, degree: ${degree}`);
    image.rotate(degree);

    // 3. upload an object to S3
    const mime = image.getMIME();

    const imageBuffer = await image.getBufferAsync(mime);

    const uploadKey = `${PROCESS}/${parsedKey.name}-${PROCESS}${parsedKey.ext}`;

    await putImageToS3(s3Client, bucketName, uploadKey, imageBuffer);
  }
};
