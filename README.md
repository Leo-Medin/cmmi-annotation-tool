CMMI Image Annotation Tool

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

Install the dependenies (e.g. "npm i") and run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

## Learn More about Next.js

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

## Set up AWS S3 Storage Bucket for images

Create S3 Storage Bucket (https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html), create an IAM user with access to storage bucket, and create access key under that user (https://repost.aws/knowledge-center/create-access-key).

Add the following environmental variables into .env.local (for local development) and into host settings:
MYAWS_ACCESS_KEY_ID
MYAWS_SECRET_ACCESS_KEY
MYAWS_S3_BUCKET_NAME

## Connect Postgres database to store user requests

Add the following environmental variables into .env.local (for local development) and into host settings:
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD

## Get OpenAI access key

(https://platform.openai.com/api-keys)

Add the following environmental variables into .env.local (for local development) and into host settings:
OPENAI_API_KEY

## Deploy to AWS Amplify

This project was deployed on AWS Amplify. Here is a 3-step tutorial on how to connect your repository and deploy (https://docs.aws.amazon.com/amplify/latest/userguide/getting-started-next.html)
Once this is done, every push to main branch will initiate an automatic deployment on AWS.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.

## API description

See /docs/swagger.yaml or visit this page on SwaggerHub (https://app.swaggerhub.com/apis/SergeyOlkhin/ai-vision_api/1.0.0)