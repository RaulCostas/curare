import { Module } from '@nestjs/common';
import { DatabaseRestoreController } from './database_restore.controller';

@Module({
  controllers: [DatabaseRestoreController],
})
export class DatabaseRestoreModule {}
