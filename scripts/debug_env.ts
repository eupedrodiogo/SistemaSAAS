
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');

console.log(`Checking file at: ${envPath}`);

if (!fs.existsSync(envPath)) {
    console.error('File does NOT exist.');
} else {
    console.log('File exists.');
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const key = trimmed.split('=')[0];
            console.log(`Found Key: ${key}`);
        }
    });
}
