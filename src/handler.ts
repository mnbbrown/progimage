import { APIGatewayProxyHandler } from 'aws-lambda';
import { v4 as uuid } from 'uuid';
import { S3 } from "aws-sdk"
import { IImage, parseRequestPath, convertImage, streamToBase64, downloadImage } from "./utils";

const BUCKET_NAME = process.env.BUCKET || 'mnbbrown-progimage';

export const sign: APIGatewayProxyHandler = async (event) => {
  const requestBody = JSON.parse(event.body);
  const id = uuid();

  // Generate signed URL
  const objectParams = {
    Bucket: BUCKET_NAME,
    Key: id,
    ContentType: requestBody.contentType,
    Expires: 14 * 24 * 3600
  }

  const s3 = new S3();
  const uploadURL = s3.getSignedUrl('putObject', objectParams);
  return {
    statusCode: 200,
    body: JSON.stringify({
      id: id,
      url: uploadURL
    }),
  };
}

const generateImageResponse = async (image: IImage) => {
  const encoded = await streamToBase64(image.stream);
  return {
    statusCode: 200,
    body: encoded,
    headers: { 'Content-Type': image.contentType },
    isBase64Encoded: true
  };
}

export const get: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse request
    const { id, contentType } = parseRequestPath(event.pathParameters.id);

    // Get image
    const image = await downloadImage(BUCKET_NAME, id);

    // Return image if contentType matches
    if (image.contentType === contentType) {
      return generateImageResponse(image);
    }

    // Convert image if not
    const converted = await convertImage(image, contentType);
    return generateImageResponse(converted);
  } catch (e) {
    return {
      statusCode: e.statusCode || 500,
      body: JSON.stringify({ message: e.message || 'Internal Server Error' })
    }
  }
}
