import AWS from 'aws-sdk';
import type { NextApiRequest, NextApiResponse } from 'next';

function dataURLtoBuffer(dataurl: string) {
    const arr = dataurl.split(',');
    const bstrBuf = Buffer.from(arr[1], 'base64');
    const bstr = bstrBuf.toString('binary');
    let n = bstr.length;
    const u8arr = new Uint8Array(n)
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }

    const buffer = Buffer.from(u8arr);

    return buffer;    
}


export default async function UploadAPI(req: NextApiRequest, res: NextApiResponse) {
  console.log('upload() req.method', req.method);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  if (req.method === 'OPTIONS') {
    res.send({
      token: 'OPTIONS !!!'
    });

    return;
  }

  if (!req.body.folder) {
    res.send({ status: false, message: 'no folder provided' });

    return;
  }
  if (!req.body.filename) {
    res.send({ status: false, message: 'no filename provided' });

    return;
  }
  if (!req.body.file) {
    res.send({ status: false, message: 'no file provided' });

    return;
  }
  if (!req.body.contentType) {
    res.send({ status: false, message: 'no contentType provided' });

    return;
  }

  const folder = req.body.folder;
  console.log('upload() folder:', folder);
  const filename = req.body.filename;
  console.log('upload() filename:', filename);
  const file64 = req.body.file;
  const contentType = req.body.contentType;

  if(!file64) {
      const descr = 'Error, no file provided';
      console.log(descr);
      res.send({ status: false, message: descr });

      return;
  }
  const fileBuffer = dataURLtoBuffer(file64);

  const s3 = new AWS.S3({
    accessKeyId: process.env.MYAWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.MYAWS_SECRET_ACCESS_KEY || ''
  });

  let fullname = filename;
  if (folder) fullname = folder + '/' + filename;
  const params = {
    Bucket: process.env.MYAWS_S3_BUCKET_NAME || '',
    Key: fullname,
    Body: fileBuffer,
    ContentType: contentType
  };

  try {
    const uploadResult = await s3.upload(params).promise();
    console.log('uploadResult:', uploadResult);
    res.send({ status: true, message: 'File uploaded to S3 successfully!', url: uploadResult.Location });
  } catch (error: unknown) {
    console.error(error);
    res.send({ status: false, message: error instanceof Error? error.message: error });
  }

  return;

};



