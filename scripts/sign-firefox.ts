// Copyright 2025 Yumeto Inaoka
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { spawnSync } from 'child_process';
import { loadEnv } from './utils/load-env.ts';

const projectRoot = resolve(import.meta.dirname, '..');
loadEnv(projectRoot);

const requiredKeys = ['WEB_EXT_API_KEY', 'WEB_EXT_API_SECRET'];
const missing = requiredKeys.filter((key) => !process.env[key]);
if (missing.length > 0) {
    console.error(`web-ext 署名に必要な環境変数が見つかりません: ${missing.join(', ')}`);
    console.error('`.env` に値を設定するか、実行前に環境変数をエクスポートしてください。');
    process.exit(1);
}

const channel = (process.env.WEB_EXT_CHANNEL || 'unlisted').toLowerCase();
if (!['listed', 'unlisted'].includes(channel)) {
    console.error(`WEB_EXT_CHANNEL は 'listed' または 'unlisted' を指定してください（現在: ${channel}）。`);
    process.exit(1);
}

const args = [
    'web-ext',
    'sign',
    '--source-dir',
    join(projectRoot, 'dist', 'firefox'),
    '--artifacts-dir',
    join(projectRoot, 'releases', 'firefox'),
    '--channel',
    channel,
];

const metadata: Record<string, unknown> = {};
const versionMetadata: Record<string, unknown> = {};
const amoLicenseRaw = process.env.WEB_EXT_AMO_LICENSE || (channel === 'listed' ? 'all-rights-reserved' : '');
const amoLicense = amoLicenseRaw.replace(/^"|"$/g, '');
const amoCustomLicense = process.env.WEB_EXT_AMO_CUSTOM_LICENSE;
const amoCustomLicensePath = process.env.WEB_EXT_AMO_CUSTOM_LICENSE_PATH;
const amoCustomLicenseNameRaw = process.env.WEB_EXT_AMO_CUSTOM_LICENSE_NAME || 'Custom License';
const amoCustomLicenseName = amoCustomLicenseNameRaw.replace(/^"|"$/g, '');

let customLicenseText = amoCustomLicense;
if (!customLicenseText && amoCustomLicensePath) {
    const resolvedPath = resolve(projectRoot, amoCustomLicensePath);
    if (!existsSync(resolvedPath)) {
        console.error(`WEB_EXT_AMO_CUSTOM_LICENSE_PATH のファイルが見つかりません: ${resolvedPath}`);
        process.exit(1);
    }
    customLicenseText = readFileSync(resolvedPath, 'utf8');
}

if (customLicenseText) {
    customLicenseText = customLicenseText.replace(/^"|"$/g, '');
    versionMetadata.custom_license = {
        name: { 'en-US': amoCustomLicenseName },
        text: { 'en-US': customLicenseText },
    };
}

if (amoLicense) {
    versionMetadata.license = amoLicense;
}

if (Object.keys(versionMetadata).length > 0) {
    metadata.version = versionMetadata;
}

const summary = (
    process.env.WEB_EXT_AMO_SUMMARY ||
    process.env.WEB_EXT_AMO_SUMMARY_EN_US ||
    'Display Value Books stock info on Amazon.co.jp book pages.'
).trim();
const categoriesEnv = process.env.WEB_EXT_AMO_CATEGORIES;
const categories = categoriesEnv
    ? categoriesEnv.split(',').map((cat) => cat.trim()).filter(Boolean)
    : ['other'];

if (summary) {
    metadata.summary = { 'en-US': summary };
}

if (categories.length > 0) {
    metadata.categories = categories;
}

const metadataKeys = Object.keys(metadata);
if (channel === 'listed' && metadataKeys.length === 0) {
    console.error('listed チャネルで署名する場合、summary/categories/license を含むメタデータが必要です。');
    process.exit(1);
}

if (metadataKeys.length > 0) {
    const tempDir = mkdtempSync(join(tmpdir(), 'web-ext-metadata-'));
    const metadataPath = join(tempDir, 'metadata.json');
    writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log('web-ext に送信する AMO メタデータ:', metadata);
    args.push('--amo-metadata', metadataPath);
}

const result = spawnSync('npx', args, {
    stdio: 'inherit',
    env: process.env,
});

if (result.error) {
    console.error('web-ext sign の実行に失敗しました:', result.error);
    process.exit(result.status ?? 1);
}

process.exit(result.status ?? 0);
