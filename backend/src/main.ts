import * as dotenv from 'dotenv';
import { join } from 'path';
dotenv.config({ path: join(process.cwd(), '../.env') });
dotenv.config({ path: join(process.cwd(), '.env') });

process.env.TZ = 'America/La_Paz';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.enableCors();

  // Serve static files from persistent disk if available, otherwise local uploads
  const uploadDir = (fs.existsSync('/data') && process.platform !== 'win32') 
    ? '/data' 
    : join(process.cwd(), 'uploads');
    
  console.log(`[Main] Serving static assets from: ${uploadDir}`);
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`Backend is running on: ${await app.getUrl()}`);
}
bootstrap();
