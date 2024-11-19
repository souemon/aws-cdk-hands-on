import { S3Handler, S3Event } from "aws-lambda";
import { S3Client } from "@aws-sdk/client-s3";
import { getImageFromS3, putImageToS3 } from "../../common/src/index";
import { S3Message } from "../../common/src/types";
import path from "path";
import {
  SendMessageCommand,
  SQSClient,
  SendMessageCommandInput,
} from "@aws-sdk/client-sqs";

const QUEUE_URL = process.env.QUEUE_URL;
const PROCESS = "resize";

export const handler: S3Handler = async (event: S3Event) => {
  console.log(JSON.stringify(event, null, 2));

  const s3Client = new S3Client();
  for (const record of event.Records) {
    // 1. download an object from S3
    const bucketName = record.s3.bucket.name;
    const key = record.s3.object.key;
    const parsedKey = path.parse(key);

    const image = await getImageFromS3(s3Client, bucketName, key);

    const width = image.getWidth();
    const height = image.getHeight();
    console.log(`original size: (${width}, ${height})`);

    const resizedWidth = Math.floor(width / 2);
    const resizedHeight = Math.floor(height / 2);
    console.log(`${PROCESS}: (${resizedWidth}, ${resizedHeight})`);

    image.resize(resizedWidth, resizedHeight);

    // 3. upload an object to S3
    const mime = image.getMIME();

    const imageBuffer = await image.getBufferAsync(mime);

    const uploadKey = `${PROCESS}/${parsedKey.name}-${PROCESS}${parsedKey.ext}`;

    await putImageToS3(s3Client, bucketName, uploadKey, imageBuffer);

    // 4. send message to SQS
    const s3Message: S3Message = { bucketName, key: uploadKey };
    // sqs client
    const sqsClient = new SQSClient();
    const input: SendMessageCommandInput = {
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(s3Message),
    };
    const command: SendMessageCommand = new SendMessageCommand(input);
    await sqsClient.send(command);
    console.log(`sent the message to SQS: ${JSON.stringify(s3Message)}`);
  }
};
