import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { BackupService } from './backup.service';
import { CreateBackupDto } from './dto/create-backup.dto';

@Controller('backup')
export class BackupController {
    constructor(private readonly backupService: BackupService) { }

    @Post('create')
    async createBackup(@Body() createBackupDto: CreateBackupDto) {
        return await this.backupService.createBackup(createBackupDto);
    }

    @Get('list')
    async listBackups() {
        return await this.backupService.listBackups();
    }

    @Get('info/:filename')
    async getBackupInfo(@Param('filename') filename: string) {
        return await this.backupService.getBackupInfo(filename);
    }

    @Post('restore/:filename')
    async restoreBackup(@Param('filename') filename: string) {
        return await this.backupService.restoreBackup(filename);
    }

    @Delete(':filename')
    async deleteBackup(@Param('filename') filename: string) {
        return await this.backupService.deleteBackup(filename);
    }
}
