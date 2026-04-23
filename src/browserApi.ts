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

/**
 * ブラウザ間で互換的にWebExtension APIへアクセスするためのヘルパー。
 * Firefoxでは`browser`、Chromium系では`chrome`名前空間を参照する。
 */

// Firefox向け型宣言。`browser`が存在しない環境ではundefinedになる。
declare const browser: typeof chrome | undefined;

const extensionApi: typeof chrome | undefined =
    typeof chrome !== 'undefined'
        ? chrome
        : typeof browser !== 'undefined'
          ? browser
          : undefined;

if (!extensionApi) {
    throw new Error('WebExtension APIが利用できません。');
}

export const browserApi = extensionApi;
