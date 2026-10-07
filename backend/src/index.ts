import dotenv from 'dotenv';
import { app } from './app.js';

dotenv.config();

const port = Number(process.env.PORT ?? 4000);

if (!process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}

export { app };
