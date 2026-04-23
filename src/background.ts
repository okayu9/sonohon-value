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
 * バリューブックス検索拡張機能 - バックグラウンドスクリプト
 * メッセージハンドリングとバリューブックスからの情報取得を担当します
 */

import { browserApi } from './browserApi';
import { extractBookInfo } from './parser';
import type { BookInfo, MessageResponse } from './types';

// ===== メッセージハンドリング =====

/**
 * メッセージリスナーの設定
 */
browserApi.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    // 書籍検索リクエスト
    if (request.action === 'searchUsedBooks' && request.isbn) {
        handleSearchRequest(request.isbn, sendResponse);
        return true; // 非同期レスポンスを示すためにtrueを返す
    }
    // オプションページを開くリクエスト
    else if (request.action === 'openOptionsPage') {
        browserApi.runtime.openOptionsPage();
        return false; // レスポンスが不要なのでfalseを返す
    }
    // 未知のアクションの場合
    else {
        console.warn('不明なアクション:', request.action);
        sendResponse({ error: '不明なアクションです' });
        return false;
    }
});

/**
 * 書籍検索リクエストを処理する
 * @param isbn 検索するISBN
 * @param sendResponse レスポンスコールバック
 */
function handleSearchRequest(
    isbn: string,
    sendResponse: (response: MessageResponse) => void,
): void {
    searchUsedBooks(isbn)
        .then((bookInfo: BookInfo) => {
            sendResponse({ bookInfo });
        })
        .catch((error) => {
            console.error('書籍情報取得エラー:', error);
            sendResponse({
                error: `書籍情報の取得に失敗しました: ${error.message || '不明なエラー'}`,
            });
        });
}

// ===== データ取得 =====

/**
 * バリューブックスで書籍情報を検索する
 * @param isbn 検索するISBN
 * @returns 書籍情報
 */
async function searchUsedBooks(isbn: string): Promise<BookInfo> {
    try {
        const searchUrl = `https://www.valuebooks.jp/search?keyword=${encodeURIComponent(isbn)}`;
        const response = await fetch(searchUrl, {
            method: 'GET',
            headers: {
                Accept: 'text/html',
                'Cache-Control': 'no-cache',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`HTTP エラー: ${response.status}`);
        }

        const html = await response.text();
        return extractBookInfo(html);
    } catch (error) {
        console.error('バリューブックス検索エラー:', error);
        throw error;
    }
}
