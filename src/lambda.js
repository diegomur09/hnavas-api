import serverless from "serverless-http";
import app from "./app.js";

// AWS Lambda entrypoint (works behind a Lambda Function URL or API Gateway).
export const handler = serverless(app);
