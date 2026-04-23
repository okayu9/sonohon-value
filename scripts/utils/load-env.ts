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
