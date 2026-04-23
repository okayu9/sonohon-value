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

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { build, context } from 'esbuild';
import { loadEnv } from './utils/load-env.ts';

const projectRoot = resolve(import.meta.dirname, '..');

const entryPoints = [
    join(projectRoot, 'src/background.ts'),
    join(projectRoot, 'src/content.ts'),
    join(projectRoot, 'src/options.ts'),
];

type Browser = 'chrome' | 'firefox';

const targets: Record<Browser, string> = {
    chrome: 'es2020',
    firefox: 'firefox115',
};

function parseArgs(): { browser: Browser; prod: boolean; watch: boolean } {
    const args = process.argv.slice(2);
    const browser = args[0] as Browser;

    if (browser !== 'chrome' && browser !== 'firefox') {
        console.error('Usage: node scripts/build.ts <chrome|firefox> [--prod] [--watch]');
        process.exit(1);
    }

    return {
        browser,
        prod: args.includes('--prod'),
        watch: args.includes('--watch'),
    };
}

function copyAssets(browser: Browser): void {
    const outDir = join(projectRoot, 'dist', browser);
    mkdirSync(outDir, { recursive: true });

    // 共通アセット
    for (const file of ['options.html', 'options.css', 'icon-16.png', 'icon-48.png', 'icon-128.png']) {
        cpSync(join(projectRoot, 'src', file), join(outDir, file));
    }

    if (browser === 'chrome') {
        cpSync(join(projectRoot, 'src/manifest.json'), join(outDir, 'manifest.json'));
    } else {
        // Firefox: テンプレートから manifest を生成
        generateFirefoxManifest(outDir);
    }
}

function generateFirefoxManifest(outDir: string): void {
    loadEnv(projectRoot);

    const geckoId = process.env.WEB_EXT_GECKO_ID;
    if (!geckoId) {
        console.error('WEB_EXT_GECKO_ID が設定されていません。`.env` もしくは環境変数に値を追加してください。');
        process.exit(1);
    }

    const templatePath = join(projectRoot, 'src/manifest.firefox.template.json');
    if (!existsSync(templatePath)) {
        console.error(`テンプレートが見つかりません: ${templatePath}`);
        process.exit(1);
    }

    const template = readFileSync(templatePath, 'utf8');
    const replaced = template.replace(/__GECKO_ID__/g, geckoId);

    try {
        JSON.parse(replaced);
    } catch (error) {
        console.error('生成した manifest.json が不正な JSON です:', error);
        process.exit(1);
    }

    writeFileSync(join(outDir, 'manifest.json'), replaced, 'utf8');
}

async function main(): Promise<void> {
    const { browser, prod, watch: watchMode } = parseArgs();
    const outDir = join(projectRoot, 'dist', browser);

    const buildOptions = {
        entryPoints,
        bundle: true,
        outdir: outDir,
        target: targets[browser],
        format: 'esm' as const,
        minify: prod,
        sourcemap: !prod,
    };

    if (watchMode) {
        const ctx = await context(buildOptions);
        await ctx.watch();
        console.log(`[${browser}] watching...`);
    } else {
        await build(buildOptions);
        copyAssets(browser);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
