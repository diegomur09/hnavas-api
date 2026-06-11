import serverless from 'serverless-http';
import app from './app.js';

// AWS Lambda entrypoint (works behind a Lambda Function URL or API Gateway).
// The Lambda runtime resolves the NAMED export (`lambda.handler`), so it must
// stay named; the default export only exists to satisfy the import plugin.
export const handler = serverless(app);
export default handler;
