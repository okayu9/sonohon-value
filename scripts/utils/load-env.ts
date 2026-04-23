import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export function loadEnv(projectRoot: string): void {
    const envPath = join(projectRoot, '.env');
    if (!existsSync(envPath)) {
        return;
    }

    const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        if (!line || line.trim().startsWith('#')) {
            continue;
        }
        const delimiterIndex = line.indexOf('=');
        if (delimiterIndex === -1) {
            continue;
        }
        const key = line.slice(0, delimiterIndex).trim();
        const value = line.slice(delimiterIndex + 1).trim();
        if (key && !(key in process.env)) {
            process.env[key] = value;
        }
    }
}
