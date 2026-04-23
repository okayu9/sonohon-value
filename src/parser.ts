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
 * バリューブックス検索拡張機能 - HTMLパーサー
 * バリューブックスのHTMLレスポンスから書籍情報を抽出します
 */

import type { BookInfo } from './types';

/**
 * HTML文字列から書籍情報を抽出する
 * @param html 解析するHTML文字列
 * @returns 書籍情報
 */
export function extractBookInfo(html: string): BookInfo {
    // router-viewのitem-info属性から書籍情報を抽出
    const itemInfoRegex = /<router-view[^>]*:item-info="([^"]+)"/;
    const match = html.match(itemInfoRegex);

    if (!match?.[1]) {
        // 代替パターンを試す
        const alternativeRegex = /window\.__NUXT__\s*=\s*({.*})/;
        const altMatch = html.match(alternativeRegex);

        if (altMatch?.[1]) {
            try {
                // NUXTデータから書籍情報を抽出する試み
                return extractFromNuxtData(altMatch[1]);
            } catch (e) {
                console.error('代替パターンでの抽出に失敗:', e);
            }
        }

        throw new Error('書籍情報が見つかりませんでした');
    }

    return decodeAndParse(match[1]);
}

/**
 * HTMLエンコードされた書籍情報文字列をデコードしてパースする
 * @param encoded HTMLエンコードされたJSON文字列
 * @returns 書籍情報
 */
export function decodeAndParse(encoded: string): BookInfo {
    // Service Worker環境にはDOMがないため、HTML実体参照を手動でデコード
    const decoded = encoded
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'");

    const parsed: unknown = JSON.parse(decoded);
    if (!isBookInfo(parsed)) {
        throw new Error('書籍情報の形式が不正です');
    }
    return parsed;
}

/**
 * BookInfo の構造を持っているか検証する
 */
export function isBookInfo(value: unknown): value is BookInfo {
    if (typeof value !== 'object' || value === null) return false;
    const obj = value as Record<string, unknown>;
    return (
        typeof obj.vs_catalog_id === 'string' &&
        Array.isArray(obj.genpinList) &&
        obj.genpinList.every(
            (g: unknown) =>
                typeof g === 'object' &&
                g !== null &&
                typeof (g as Record<string, unknown>).conditionName ===
                    'string' &&
                typeof (g as Record<string, unknown>).price === 'number' &&
                typeof (g as Record<string, unknown>).stock === 'number',
        )
    );
}

/**
 * NUXT初期データから書籍情報を抽出する（代替手段）
 * @param nuxtDataStr NUXT初期データ文字列
 * @returns 書籍情報
 */
export function extractFromNuxtData(nuxtDataStr: string): BookInfo {
    try {
        // JavaScriptリテラルをJSONに近づける前処理
        // プロパティ値としての undefined のみ null に置換（文字列中のものは避ける）
        const safeStr = nuxtDataStr.replace(/:\s*undefined\b/g, ': null');

        const nuxtData = JSON.parse(safeStr);

        // NUXTデータ構造から書籍情報を探索
        // 注: この部分はバリューブックスのサイト構造に依存するため、
        // サイト変更時に更新が必要になる可能性があります
        const items = nuxtData?.state?.search?.items;
        if (Array.isArray(items)) {
            for (const item of items) {
                if (isBookInfo(item)) {
                    return item;
                }
            }
        }

        throw new Error('NUXT初期データから書籍情報を抽出できませんでした');
    } catch (e) {
        if (e instanceof Error && e.message.includes('NUXT')) {
            throw e;
        }
        console.error('NUXT初期データのパースに失敗:', e);
        throw new Error('データ解析に失敗しました');
    }
}
