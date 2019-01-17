import { S3 } from "aws-sdk";
import * as sharp from "sharp";
import { PassThrough, Readable } from "stream";
import { parse } from "path";
import { SUPPORTED_MIMES, OUTPUT_FORMATS } from "./consts";

export interface IImage {
  contentType: string;
  stream: Readable;
}

export const downloadImage = async (bucket: string, id: string): Promise<IImage> => {
  const s3 = new S3();
  const metadata = await s3.headObject({ Key: id, Bucket: bucket }).promise();
  const stream = s3.getObject({ Key: id, Bucket: bucket }).createReadStream();
  return { contentType: metadata.ContentType, stream };
}

export const streamToBase64 = (input: Readable): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    input.on('data', (data) => {
      chunks.push(data);
    });
    input.on('end', () => {
      resolve(Buffer.concat(chunks).toString('base64'));
    });
    input.on('error', (err) => {
      reject(err);
    })
  })
}

export const convertImage = (image: IImage, contentType: string): IImage => {
  const out = new PassThrough();
  const outputFormat = OUTPUT_FORMATS[contentType];
  image.stream.pipe(sharp().toFormat(outputFormat)).pipe(out);
  return {
    contentType,
    stream: out
  }
}

const getContentType = (ext: string): string => {
  const contentType = SUPPORTED_MIMES[ext];
  if (!contentType) {
    throw new Error("Unknown file type");
  }
  return contentType;
}

export const parseRequestPath = (id: string) => {
  const requestedId = parse(id);
  const contentType = getContentType(requestedId.ext.replace(".", ""));
  return { id: requestedId.name, contentType }
}
