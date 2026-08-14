const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { FirmasService } = require('./dist/firmas/firmas.service');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const firmasService = app.get(FirmasService);
  
  try {
    const res = await firmasService.create({
      tipoDocumento: 'historia_clinica',
      documentoId: 1,
      tipoFirma: 'dibujada',
      firmaData: 'data:image/png;base64,123',
      rolFirmante: 'paciente',
      hashDocumento: '123',
      ipAddress: '1.1.1.1',
      userAgent: 'test'
    }, 1);
    console.log('Success:', res);
  } catch (err) {
    console.error('Error:', err);
  }
  
  await app.close();
}

bootstrap().catch(console.error);
