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
 * バリューブックス検索拡張機能 - コンテンツスクリプト
 * Amazon.co.jpの書籍ページにバリューブックスの在庫情報を表示します
 */

import { selectBestBookInfo } from './bookLogic';
import { browserApi } from './browserApi';
import { getISBN, getKindlePageISBNs, isKindlePage } from './isbn';
import type { BookInfo, MessageResponse } from './types';
import { displayError, displayVBAPriceInfo } from './ui';

/**
 * 拡張機能のメッセージを送信する
 */
function sendMessage<T>(message: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
        browserApi.runtime.sendMessage(message, (response) => {
            if (browserApi.runtime.lastError) {
                reject(browserApi.runtime.lastError);
            } else {
                resolve(response as T);
            }
        });
    });
}

/**
 * 書籍情報を取得する
 */
async function getBookInfo(isbn: string): Promise<BookInfo | null> {
    try {
        const response = await sendMessage<MessageResponse>({
            action: 'searchUsedBooks',
            isbn,
        });

        if (response.bookInfo) {
            return response.bookInfo;
        }

        if (response.error) {
            console.error('バリューブックス情報取得エラー:', response.error);
        }

        return null;
    } catch (error) {
        console.error('書籍情報取得中にエラーが発生しました:', error);
        return null;
    }
}

/**
 * 複数のISBNから最適な書籍情報を取得する
 */
async function getBestBookInfo(isbns: string[]): Promise<BookInfo | null> {
    if (isbns.length === 0) {
        return null;
    }

    const uniqueIsbns = [...new Set(isbns)];

    const bookInfoPromises = uniqueIsbns.map((isbn) => getBookInfo(isbn));
    const bookInfoResults = await Promise.all(bookInfoPromises);

    const validBookInfos = bookInfoResults.filter(
        (info): info is BookInfo => info !== null,
    );

    if (validBookInfos.length === 0) {
        return null;
    }

    return selectBestBookInfo(validBookInfos);
}

/**
 * 在庫切れ表示オプションを取得する
 */
function getShowOutOfStockOption(): Promise<boolean> {
    return new Promise((resolve) => {
        browserApi.storage.sync.get(['showOutOfStock'], (result) => {
            resolve(result.showOutOfStock || false);
        });
    });
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
    try {
        let bookInfo = null;
        const showOutOfStock = await getShowOutOfStockOption();

        if (isKindlePage(document)) {
            const isbns = getKindlePageISBNs(document);
            if (isbns.length === 0) {
                return;
            }
            bookInfo = await getBestBookInfo(isbns);
        } else {
            const isbn = getISBN(document);
            if (!isbn) {
                return;
            }
            bookInfo = await getBookInfo(isbn);
        }

        if (bookInfo) {
            await displayVBAPriceInfo(bookInfo, showOutOfStock);
        } else {
            await displayError('書籍情報を取得できませんでした');
        }
    } catch (error) {
        await displayError(`処理中にエラーが発生しました: ${error}`);
    }
}

// DOMContentLoadedイベントでメイン処理を実行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => main());
} else {
    main();
}
