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
 * バリューブックス検索拡張機能 - 型定義
 */

/**
 * 書籍情報インターフェース
 */
export interface BookInfo {
    vs_catalog_id: string;
    genpinList: {
        conditionName: string;
        price: number;
        stock: number;
    }[];
}

/**
 * 挿入位置オプション
 */
export enum InsertionLocation {
    DEFAULT = 'default', // デフォルト位置（現在の実装）
    BETWEEN_REVIEWS_DESCRIPTION = 'between_reviews_description', // 評価と概要文の間
    BELOW_DETAILS = 'below_details', // すべての詳細を表示の下
}

/**
 * メッセージレスポンスインターフェース
 */
export interface MessageResponse {
    bookInfo?: BookInfo;
    error?: string;
}

/**
 * DOM挿入位置インターフェース
 */
export interface InsertionPoint {
    parent: HTMLElement;
    reference: Node | null;
}
