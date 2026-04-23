import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import archiver from 'archiver';

const projectRoot = resolve(import.meta.dirname, '..');
const distDir = join(projectRoot, 'dist/firefox');
const manifestPath = join(distDir, 'manifest.json');

if (!existsSync(manifestPath)) {
    console.error('manifest.json が見つかりません。まず npm run build:firefox:prod:all を実行してください。');
    process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const version: string = manifest.version;

const outputDir = join(projectRoot, 'releases/firefox');
if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
}

const outputFile = join(outputDir, `value-search-firefox-v${version}.zip`);
const output = createWriteStream(outputFile);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
    const fileSizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
    console.log(`Firefox パッケージを作成しました: ${outputFile}`);
    console.log(`ファイルサイズ: ${fileSizeInMB} MB`);
});

archive.on('error', (err: Error) => {
    throw err;
});

archive.pipe(output);
archive.directory(distDir, false);
archive.finalize();
