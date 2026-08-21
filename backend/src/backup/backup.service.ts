import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { CreateBackupDto } from './dto/create-backup.dto';

const execAsync = promisify(exec);

export interface BackupInfo {
    filename: string;
    size: number;
    createdAt: string;
    path: string;
}

@Injectable()
export class BackupService {
    private readonly backupDir: string;
    private readonly dbHost: string;
    private readonly dbPort: number;
    private readonly dbName: string;
    private readonly dbUser: string;
    private readonly dbPassword: string;
    private readonly pgDumpPath: string;
    private readonly psqlPath: string;

    constructor() {
        const isWindows = process.platform === 'win32';
        const defaultBackupDir = isWindows
            ? 'C:\\ProgramData\\CURARE\\Backups'
            : '/tmp/backups';
        this.backupDir = process.env.BACKUP_DIR || defaultBackupDir;

        // Database configuration
        this.dbHost = process.env.DB_HOST || 'localhost';
        this.dbPort = parseInt(process.env.DB_PORT || '5433', 10);
        this.dbName = process.env.DB_NAME || 'curare';
        this.dbUser = process.env.DB_USER || 'postgres';
        this.dbPassword = process.env.DB_PASSWORD || 'postgrespg';

        // PostgreSQL binary paths
        let defaultPgPath = isWindows ? 'C:\\Program Files\\PostgreSQL\\17\\bin' : '/usr/bin';
        
        if (isWindows) {
            const versions = ['17', '16', '15', '14', '13', '12'];
            for (const v of versions) {
                const testPath = `C:\\Program Files\\PostgreSQL\\${v}\\bin`;
                if (fs.existsSync(path.join(testPath, 'pg_dump.exe'))) {
                    defaultPgPath = testPath;
                    break;
                }
            }
        }
        
        const pgBinPath = process.env.PG_BIN_PATH || defaultPgPath;

        // If in Linux and PG_DUMP_PATH is not set, we default to just 'pg_dump' expecting it to be in PATH, or the full path if provided.
        this.pgDumpPath = process.env.PG_DUMP_PATH || (isWindows ? path.join(pgBinPath, 'pg_dump.exe') : 'pg_dump');
        this.psqlPath = process.env.PSQL_PATH || (isWindows ? path.join(pgBinPath, 'psql.exe') : 'psql');

        // Ensure backup directory exists
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }

        console.log('PostgreSQL paths configured:');
        console.log('  pg_dump:', this.pgDumpPath);
        console.log('  psql:', this.psqlPath);
        console.log('  Backup directory:', this.backupDir);
    }

    async createBackup(createBackupDto?: CreateBackupDto): Promise<BackupInfo> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `curare_backup_${timestamp}.sql`;
        const targetDir = createBackupDto?.customPath || this.backupDir;
        const backupPath = path.join(targetDir, filename);

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        try {
            if (path.isAbsolute(this.pgDumpPath) && !fs.existsSync(this.pgDumpPath)) {
                throw new Error(`pg_dump not found at: ${this.pgDumpPath}. Please install PostgreSQL or set PG_DUMP_PATH environment variable.`);
            }

            const env = { ...process.env, PGPASSWORD: this.dbPassword };
            const command = `"${this.pgDumpPath}" -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} -d ${this.dbName} -F p -f "${backupPath}"`;

            console.log('Executing backup command...');
            await execAsync(command, { env });

            const stats = fs.statSync(backupPath);

            return {
                filename,
                size: stats.size,
                createdAt: stats.birthtime.toISOString(),
                path: backupPath,
            };
        } catch (error) {
            console.error('Error creating backup:', error);
            throw new InternalServerErrorException(`Failed to create backup: ${error.message}`);
        }
    }

    async createFullBackup(createBackupDto?: CreateBackupDto): Promise<BackupInfo> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const targetDir = createBackupDto?.customPath || this.backupDir;

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const tempSqlFile = path.join(targetDir, `curare_temp_dump_${timestamp}.sql`);
        const zipFilename = `curare_backup_COMPLETO_${timestamp}.zip`;
        const zipPath = path.join(targetDir, zipFilename);

        try {
            // 1. Create SQL Dump
            const env = { ...process.env, PGPASSWORD: this.dbPassword };
            const dumpCommand = `"${this.pgDumpPath}" -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} -d ${this.dbName} -F p -f "${tempSqlFile}"`;
            console.log('[FullBackup] Creating database dump...');
            await execAsync(dumpCommand, { env });

            // 2. Identify Uploads directory
            const uploadDir = (fs.existsSync('/data') && process.platform !== 'win32')
                ? '/data'
                : path.join(process.cwd(), 'uploads');

            // 3. Compress SQL dump and uploads directory into ZIP
            console.log('[FullBackup] Compressing database dump and uploads folder...');
            const isWindows = process.platform === 'win32';
            if (isWindows) {
                const psCommand = `powershell -Command "Compress-Archive -Path '${tempSqlFile}', '${uploadDir}' -DestinationPath '${zipPath}' -Force"`;
                await execAsync(psCommand);
            } else {
                try {
                    const zipCmd = `zip -r "${zipPath}" "${tempSqlFile}" "${uploadDir}"`;
                    await execAsync(zipCmd);
                } catch (e) {
                    const tarPath = zipPath.replace(/\.zip$/, '.tar.gz');
                    await execAsync(`tar -czf "${tarPath}" "${tempSqlFile}" "${uploadDir}"`);
                }
            }

            // 4. Remove temp SQL file
            if (fs.existsSync(tempSqlFile)) {
                try { fs.unlinkSync(tempSqlFile); } catch (e) { }
            }

            const finalPath = fs.existsSync(zipPath) ? zipPath : zipPath.replace(/\.zip$/, '.tar.gz');
            const finalFilename = path.basename(finalPath);
            const stats = fs.statSync(finalPath);

            return {
                filename: finalFilename,
                size: stats.size,
                createdAt: stats.birthtime.toISOString(),
                path: finalPath,
            };
        } catch (error) {
            if (fs.existsSync(tempSqlFile)) {
                try { fs.unlinkSync(tempSqlFile); } catch (e) { }
            }
            console.error('Error creating full backup:', error);
            throw new InternalServerErrorException(`Failed to create full backup: ${error.message}`);
        }
    }

    async listBackups(): Promise<BackupInfo[]> {
        try {
            if (!fs.existsSync(this.backupDir)) {
                return [];
            }

            const files = fs.readdirSync(this.backupDir);
            const backups: BackupInfo[] = [];

            for (const file of files) {
                if (file.endsWith('.sql') || file.endsWith('.zip') || file.endsWith('.tar.gz')) {
                    const filePath = path.join(this.backupDir, file);
                    const stats = fs.statSync(filePath);

                    backups.push({
                        filename: file,
                        size: stats.size,
                        createdAt: stats.birthtime.toISOString(),
                        path: filePath,
                    });
                }
            }

            return backups.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        } catch (error) {
            console.error('Error listing backups:', error);
            throw new InternalServerErrorException('Failed to list backups');
        }
    }

    async getBackupInfo(filename: string): Promise<BackupInfo> {
        const filePath = path.join(this.backupDir, filename);

        if (!fs.existsSync(filePath)) {
            throw new NotFoundException(`Backup file ${filename} not found`);
        }

        const stats = fs.statSync(filePath);

        return {
            filename,
            size: stats.size,
            createdAt: stats.birthtime.toISOString(),
            path: filePath,
        };
    }

    async restoreBackup(filename: string): Promise<{ message: string }> {
        const filePath = path.join(this.backupDir, filename);

        if (!fs.existsSync(filePath)) {
            throw new NotFoundException(`Backup file ${filename} not found`);
        }

        try {
            if (path.isAbsolute(this.psqlPath) && !fs.existsSync(this.psqlPath)) {
                throw new Error(`psql not found at: ${this.psqlPath}. Please install PostgreSQL or set PSQL_PATH environment variable.`);
            }

            let sqlPathToRestore = filePath;
            let tempExtractDir: string | null = null;

            // Handle ZIP backups
            if (filename.endsWith('.zip')) {
                tempExtractDir = path.join(this.backupDir, `temp_restore_${Date.now()}`);
                fs.mkdirSync(tempExtractDir, { recursive: true });

                const isWindows = process.platform === 'win32';
                if (isWindows) {
                    await execAsync(`powershell -Command "Expand-Archive -Path '${filePath}' -DestinationPath '${tempExtractDir}' -Force"`);
                } else {
                    await execAsync(`unzip -o "${filePath}" -d "${tempExtractDir}"`);
                }

                // Find SQL file inside extracted folder
                const extractedFiles = fs.readdirSync(tempExtractDir);
                const sqlFile = extractedFiles.find(f => f.endsWith('.sql'));
                if (sqlFile) {
                    sqlPathToRestore = path.join(tempExtractDir, sqlFile);
                }

                // Restore uploads if available
                const extractedUploads = path.join(tempExtractDir, 'uploads');
                const localUploads = path.join(process.cwd(), 'uploads');
                if (fs.existsSync(extractedUploads)) {
                    if (isWindows) {
                        await execAsync(`powershell -Command "Copy-Item -Path '${extractedUploads}\\*' -Destination '${localUploads}' -Recurse -Force"`);
                    } else {
                        await execAsync(`cp -r "${extractedUploads}/"* "${localUploads}/"`);
                    }
                }
            }

            const env = { ...process.env, PGPASSWORD: this.dbPassword };

            // Terminate existing connections
            const terminateCommand = `"${this.psqlPath}" -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${this.dbName}' AND pid <> pg_backend_pid();"`;
            try {
                await execAsync(terminateCommand, { env });
            } catch (error) {
                console.log('Note: Some connections may not have been terminated');
            }

            // Recreate database
            const dropCommand = `"${this.psqlPath}" -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} -d postgres -c "DROP DATABASE IF EXISTS ${this.dbName};"`;
            await execAsync(dropCommand, { env });

            const createCommand = `"${this.psqlPath}" -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} -d postgres -c "CREATE DATABASE ${this.dbName};"`;
            await execAsync(createCommand, { env });

            // Restore from SQL file
            const restoreCommand = `"${this.psqlPath}" -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} -d ${this.dbName} -f "${sqlPathToRestore}"`;
            await execAsync(restoreCommand, { env });

            // Clean temp folder if extracted
            if (tempExtractDir && fs.existsSync(tempExtractDir)) {
                try { fs.rmSync(tempExtractDir, { recursive: true, force: true }); } catch (e) {}
            }

            return { message: `Base de datos restaurada correctamente desde ${filename}` };
        } catch (error) {
            console.error('Error restoring backup:', error);
            throw new InternalServerErrorException(`Failed to restore backup: ${error.message}`);
        }
    }

    async deleteBackup(filename: string): Promise<{ message: string }> {
        const filePath = path.join(this.backupDir, filename);

        if (!fs.existsSync(filePath)) {
            throw new NotFoundException(`Backup file ${filename} not found`);
        }

        try {
            fs.unlinkSync(filePath);
            return { message: `Backup ${filename} deleted successfully` };
        } catch (error) {
            console.error('Error deleting backup:', error);
            throw new InternalServerErrorException('Failed to delete backup');
        }
    }
}
