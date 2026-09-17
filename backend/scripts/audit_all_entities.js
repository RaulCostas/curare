const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Recursively find all *.entity.ts files in src
function getFiles(dir, files = []) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getFiles(fullPath, files);
        } else if (file.endsWith('.entity.ts')) {
            files.push(fullPath);
        }
    }
    return files;
}

async function checkAll() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433', 10),
        database: process.env.DB_NAME || 'curare',
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgrespg',
    });

    await client.connect();

    // Get all tables and their columns in PostgreSQL
    const res = await client.query(`
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public';
    `);

    const tableCols = {};
    for (const row of res.rows) {
        if (!tableCols[row.table_name]) tableCols[row.table_name] = new Set();
        tableCols[row.table_name].add(row.column_name);
    }

    const entityFiles = getFiles(path.join(__dirname, '..', 'src'));

    for (const f of entityFiles) {
        const content = fs.readFileSync(f, 'utf8');
        // Extract table name from @Entity('name')
        const entityMatch = content.match(/@Entity\(['"]([^'"]+)['"]\)/);
        if (!entityMatch) continue;
        const tableName = entityMatch[1];

        if (!tableCols[tableName]) {
            console.log(`❌ Table missing in DB: "${tableName}" (defined in ${path.basename(f)})`);
            continue;
        }

        const dbCols = tableCols[tableName];
        
        // Find column names defined with @Column or @JoinColumn
        // e.g. @Column({ name: 'foo' }) or @Column() propName:
        // @JoinColumn({ name: 'foo' })
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes('@Column(') || line.includes('@JoinColumn(')) {
                let colName = null;
                const nameMatch = line.match(/name:\s*['"]([^'"]+)['"]/);
                if (nameMatch) {
                    colName = nameMatch[1];
                } else if (line.includes('@Column(') || line.includes('@Column()')) {
                    // Check next line for property name
                    let nextLine = lines[i+1] ? lines[i+1].trim() : '';
                    if (nextLine.startsWith('@')) nextLine = lines[i+2] ? lines[i+2].trim() : '';
                    const propMatch = nextLine.match(/^([a-zA-Z0-9_]+)\s*(\??):/);
                    if (propMatch) {
                        colName = propMatch[1];
                    }
                }

                if (colName && !dbCols.has(colName)) {
                    console.log(`⚠️  Table "${tableName}": missing column "${colName}" in DB! (from ${path.basename(f)})`);
                }
            }
        }
    }

    console.log('\nAudit complete.');
    await client.end();
}

checkAll().catch(console.error);
