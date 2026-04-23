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
 * バリューブックス検索拡張機能 - オプションページスクリプト
 * ユーザー設定の保存と復元を担当します
 */

import { browserApi } from './browserApi';
import { InsertionLocation } from './types';

// ===== 型定義 =====

/**
 * 拡張機能の設定インターフェース
 */
interface ExtensionOptions {
    showOutOfStock: boolean;
    insertionLocation: InsertionLocation;
}

// ===== DOM要素の参照 =====

/**
 * 在庫切れ表示オプションのチェックボックス要素を取得
 * @returns チェックボックス要素またはnull
 */
function getShowOutOfStockElement(): HTMLInputElement | null {
    return document.getElementById('show-out-of-stock') as HTMLInputElement;
}

/**
 * 挿入位置選択要素を取得
 * @returns 選択要素またはnull
 */
function getInsertionLocationElement(): HTMLSelectElement | null {
    return document.getElementById('insertion-location') as HTMLSelectElement;
}

/**
 * ステータスメッセージ要素を取得または作成
 * @returns ステータスメッセージ要素
 */
function getOrCreateStatusElement(): HTMLElement {
    let statusElement = document.getElementById('status-message');

    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = 'status-message';
        statusElement.style.margin = '10px 0';
        statusElement.style.padding = '5px';
        statusElement.style.borderRadius = '4px';
        statusElement.style.textAlign = 'center';
        statusElement.style.transition = 'opacity 1s ease-in-out';
        statusElement.style.opacity = '0';

        const optionSection = document.querySelector('.option-section');
        if (optionSection) {
            optionSection.appendChild(statusElement);
        }
    }

    return statusElement;
}

// ===== 設定の保存と復元 =====

/**
 * オプション設定を保存する
 */
function saveOptions(): void {
    const showOutOfStockElement = getShowOutOfStockElement();
    const insertionLocationElement = getInsertionLocationElement();

    const showOutOfStock = showOutOfStockElement?.checked || false;
    const insertionLocation =
        (insertionLocationElement?.value as InsertionLocation) ||
        InsertionLocation.DEFAULT;

    // 設定オブジェクトの作成
    const options: ExtensionOptions = {
        showOutOfStock,
        insertionLocation,
    };

    // ストレージに設定を保存
    browserApi.storage.sync.set(options, () => {
        if (browserApi.runtime.lastError) {
            showStatus('設定の保存に失敗しました', 'error');
            console.error('設定保存エラー:', browserApi.runtime.lastError);
        } else {
            showStatus('設定を保存しました', 'success');
        }
    });
}

/**
 * 保存されたオプション設定を復元する
 * @returns 完了を示すPromise
 */
function restoreOptions(): Promise<void> {
    return new Promise((resolve) => {
        browserApi.storage.sync.get(
            ['showOutOfStock', 'insertionLocation'],
            (result) => {
                if (browserApi.runtime.lastError) {
                    showStatus('設定の読み込みに失敗しました', 'error');
                    console.error(
                        '設定復元エラー:',
                        browserApi.runtime.lastError,
                    );
                    resolve();
                    return;
                }

                // 在庫切れ表示オプションの復元
                const showOutOfStockElement = getShowOutOfStockElement();
                if (showOutOfStockElement) {
                    showOutOfStockElement.checked =
                        result.showOutOfStock || false;
                }

                // 挿入位置オプションの復元
                const insertionLocationElement = getInsertionLocationElement();
                if (insertionLocationElement) {
                    insertionLocationElement.value =
                        result.insertionLocation || InsertionLocation.DEFAULT;
                }

                resolve();
            },
        );
    });
}

/**
 * ステータスメッセージを表示する
 * @param message 表示するメッセージ
 * @param type メッセージの種類（'success'または'error'）
 */
function showStatus(message: string, type: 'success' | 'error'): void {
    const statusElement = getOrCreateStatusElement();

    statusElement.textContent = message;
    statusElement.style.backgroundColor =
        type === 'success' ? '#d4edda' : '#f8d7da';
    statusElement.style.color = type === 'success' ? '#155724' : '#721c24';
    statusElement.style.opacity = '1';

    // 3秒後にメッセージをフェードアウト
    setTimeout(() => {
        statusElement.style.opacity = '0';
    }, 3000);
}

// ===== イベントリスナー =====

/**
 * オプションページの初期化
 */
async function initializeOptionsPage(): Promise<void> {
    try {
        await restoreOptions();

        // 変更イベントリスナーを設定
        const showOutOfStockElement = getShowOutOfStockElement();
        if (showOutOfStockElement) {
            showOutOfStockElement.addEventListener('change', saveOptions);
        }

        // 挿入位置の変更イベントリスナーを設定
        const insertionLocationElement = getInsertionLocationElement();
        if (insertionLocationElement) {
            insertionLocationElement.addEventListener('change', saveOptions);
        }

        // バージョン情報の表示
        displayVersionInfo();
    } catch (error) {
        console.error('オプションページの初期化エラー:', error);
        showStatus('ページの初期化中にエラーが発生しました', 'error');
    }
}

/**
 * 拡張機能のバージョン情報を表示
 */
function displayVersionInfo(): void {
    const manifest = browserApi.runtime.getManifest();
    const versionElement = document.getElementById('extension-version');

    if (versionElement && manifest.version) {
        versionElement.textContent = `バージョン: ${manifest.version}`;
    }
}

// DOMContentLoadedイベントでオプションページを初期化
document.addEventListener('DOMContentLoaded', () => {
    initializeOptionsPage();
});
