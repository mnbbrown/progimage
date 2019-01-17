import * as mockAWS from 'aws-sdk-mock';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as streamEqual from "stream-equal";
import { Readable } from "stream";
import { expect } from "chai";
import { streamToBase64, convertImage, parseRequestPath, downloadImage } from "./utils";
import 'mocha';

mockAWS.setSDKInstance(AWS);

describe('downloadImage', () => {
  it("should throw if the image does not exist", async () => {
    mockAWS.mock('S3', 'headObject', (_, callback) => callback('Failed to find image', null));
    try {
      await downloadImage("test-bucket", "test-image");
    } catch (e) {
      expect(e).to.equal('Failed to find image');
    }
    mockAWS.restore('S3');
  });

  it("should return an image if it exists", async () => {
    mockAWS.mock('S3', 'headObject', (_, callback) => callback(null, { ContentType: 'test'} ));
    mockAWS.mock('S3', 'getObject', () => {});
    const result = await downloadImage("test-bucket", "test-image");
    expect(result.contentType).to.equal("test");
    mockAWS.restore('S3');
  });
});

describe("streamToBase64", () => {
  it("handles a simple readable", async () => {
    const s = new Readable();
    s.push('sample text');
    s.push(null);
    const output = await streamToBase64(s);
    expect(output).to.equal('c2FtcGxlIHRleHQ=');
  });
});

describe("convertImage", () => {
  it("handles converting between filetypes", async () => {
    const image = {
      contentType: 'image/png',
      stream: fs.createReadStream('fixtures/input.png'),
    };
    const convert = await convertImage(image, 'image/jpeg');
    expect(convert.contentType).to.equal('image/jpeg');
    if (process.env.UPDATE_GOLDENS) {
      convert.stream.pipe(fs.createWriteStream("fixtures/out.jpg"));
    }
    expect(await streamEqual(fs.createReadStream('fixtures/out.jpg'), convert.stream)).to.equal(true);
  });
})

describe("parseRequestPath", () => {
  it("should handle unknown extensions", () => {
    try {
      parseRequestPath("")
    } catch (e) {
      expect(e.message).to.equal("Unknown file type");
    }
  });

  it("should handle known extensions", () => {
    const exts = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
    exts.forEach((e) => {
      const { id, contentType } = parseRequestPath(`test.${e}`);
      expect(id).to.equal('test');
      expect(contentType).to.equal(`image/${e.replace("jpg", "jpeg")}`);
    });
  });
})
