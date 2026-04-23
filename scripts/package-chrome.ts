import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import archiver from 'archiver';

const projectRoot = resolve(import.meta.dirname, '..');
const distDir = join(projectRoot, 'dist/chrome');
const manifestPath = join(distDir, 'manifest.json');

if (!existsSync(manifestPath)) {
    console.error('manifest.json が見つかりません。まず npm run build:chrome:prod:all を実行してください。');
    process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const version: string = manifest.version;

const outputDir = join(projectRoot, 'releases');
if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
}

const outputFile = join(outputDir, `value-search-v${version}.zip`);
const output = createWriteStream(outputFile);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
    const fileSizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
    console.log(`パッケージングが完了しました: ${outputFile}`);
    console.log(`ファイルサイズ: ${fileSizeInMB} MB`);
});

archive.on('error', (err: Error) => {
    throw err;
});

archive.pipe(output);
archive.directory(distDir, false);
archive.finalize();
