import { vision } from './openai';
import ServerlessClient from 'serverless-postgres';
import type { NextApiRequest, NextApiResponse } from 'next';

const client = new ServerlessClient({
  application_name: 'cmmi-annotation-tool',
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT as string),
  debug: true,
  delayMs: 3000,
  ssl: {
    rejectUnauthorized: false
  }
})

export default async function ai(req: NextApiRequest, res: NextApiResponse) {
  let isConnected: boolean;

  if (req.method === 'POST') {

    if (!req.body) {
      res.status(400).json({ message: 'no body in request' });

      return;
    }

    if (!req.body.mode) {
      res.status(400).json({ message: 'no mode in request' });

      return;
    }

    isConnected = false;
    await client.connect()
    .then(()=>{
      isConnected = true;
    })
    .catch((err)=>{
        console.log('client.connect Exception!', err)
        res.send({ status: false, message: err.message? err.message: err });

        return;

    })
    if (!isConnected) return;

    switch (req.body.mode) {
      case 'process-vision-request':
        if (!req.body.text) {
          res.status(400).json({ status: false, message: 'no text provided' });

          await client.clean();

          return;
        }
        if (!req.body.imageUrl) {
          res.status(400).json({ status: false, message: 'no imageUrl provided' });

          await client.clean();

          return;
        }

        const response = await vision({
          text: req.body.text,
          imageUrl: req.body.imageUrl
        });

        const query = `INSERT INTO ai_requests_log (arl_user_id, arl_text, arl_image_url, arl_response) values ($1, $2, $3, $4)`;
        await client.query(query, [1, req.body.text, req.body.imageUrl, response])
        .catch(async (err)=> {
            console.log('client.query err!', err)

            res.send({ status: false, message: err.message? err.message: err });

            await client.clean();

            return;
        })
        
        res.send({ status: true, response });

        await client.clean();

        return;

      default:
        res.send({ status: false, message: `nothing for mode ${req.body.mode}` });

        await client.clean();

        return;
    }

  } else {
    // Handle any other HTTP method
    res.status(405).json({ message: `${req.method} is not supported` })
  }
}

