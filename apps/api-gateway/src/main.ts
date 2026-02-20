/**
 * API Gateway - Point d'entrée unique pour le SaaS Hub.
 * Router: /api/auth -> Auth Service
 * Router: /api/tenants -> Tenant Service
 * Router: /api/hub -> Hub Backend
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { createProxyMiddleware } from 'http-proxy-middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // --- Proxy Configuration ---

  // Auth Service -> http://localhost:3001
  // Route: /api/auth/* -> http://localhost:3001/api/auth/*
  app.use(
    '/api/auth',
    createProxyMiddleware({
      target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      changeOrigin: true,
      pathRewrite: {
        // Pas de rewrite nécessaire si le service écoute déjà sur /api/auth
        // '^/api/auth': '/api/auth', 
      },
    })
  );

  // Tenant Service -> http://localhost:3002
  // Route: /api/tenants/* -> http://localhost:3002/api/* (à vérifier)
  app.use(
    '/api/tenants',
    createProxyMiddleware({
      target: process.env.TENANT_SERVICE_URL || 'http://localhost:3002',
      changeOrigin: true,
      pathRewrite: {
        // '^/api/tenants': '/api', 
      },
    })
  );

  // Hub Backend -> http://localhost:3000
  // Route: /api/hub/* -> http://localhost:3000/api/*
  app.use(
    '/api/hub',
    createProxyMiddleware({
      target: process.env.HUB_SERVICE_URL || 'http://localhost:3000',
      changeOrigin: true,
      pathRewrite: {
        // '^/api/hub': '/api', 
      },
    })
  );

  const port = process.env.API_GATEWAY_PORT || 4000;
  await app.listen(port);
  Logger.log(
    `🚀 API Gateway is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(`   - Auth: /api/auth -> :3001`);
  Logger.log(`   - Tenants: /api/tenants -> :3002`);
  Logger.log(`   - Hub: /api/hub -> :3000`);
}

bootstrap();
