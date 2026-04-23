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
 * バリューブックス検索拡張機能 - 書籍ロジック
 * 純粋関数として書籍データの処理ロジックを提供します
 */

import type { BookInfo } from './types';

/**
 * 商品状態名を日本語に変換する
 * @param conditionName 商品状態名（英語）
 * @returns 商品状態名（日本語）
 */
export function convertConditionName(conditionName: string): string {
    const conditionMap: Record<string, string> = {
        NEW: '新品',
        VERY_GOOD: '非常に良い',
        GOOD: '良い',
        ACCEPTABLE: 'キズや使用感あり',
    };

    return conditionMap[conditionName] || conditionName;
}

/**
 * 在庫がある状態の数を返す
 */
function inStockCount(info: BookInfo): number {
    return info.genpinList.filter((g) => g.stock > 0).length;
}

/**
 * 価格と在庫状態数で2つの BookInfo を比較し、より良い方を返す
 * 価格が低い方を優先し、同価格なら在庫状態数が多い方を優先する
 */
function preferBetter(
    best: BookInfo,
    current: BookInfo,
    getPrice: (info: BookInfo) => number,
): BookInfo {
    const bestPrice = getPrice(best);
    const currentPrice = getPrice(current);

    if (currentPrice < bestPrice) {
        return current;
    }
    if (
        currentPrice === bestPrice &&
        inStockCount(current) >= inStockCount(best)
    ) {
        return current;
    }
    return best;
}

/**
 * 最適な書籍情報を選択する
 * @param bookInfos 書籍情報の配列
 * @returns 最適な書籍情報
 */
export function selectBestBookInfo(bookInfos: BookInfo[]): BookInfo {
    if (bookInfos.length === 1) {
        return bookInfos[0];
    }

    // 1. 新品があるものを優先
    const withNewCondition = bookInfos.filter((info) =>
        info.genpinList.some(
            (genpin) => genpin.conditionName === 'NEW' && genpin.stock > 0,
        ),
    );

    if (withNewCondition.length > 0) {
        // 2. 複数の新品があれば一番安いものを選択
        return withNewCondition.reduce((best, current) =>
            preferBetter(
                best,
                current,
                (info) =>
                    info.genpinList.find(
                        (g) => g.conditionName === 'NEW' && g.stock > 0,
                    )?.price ?? Infinity,
            ),
        );
    }

    // 3. 新品がない場合は状態に限らず一番安いものを選択
    return bookInfos.reduce((best, current) =>
        preferBetter(best, current, (info) => {
            const prices = info.genpinList
                .filter((g) => g.stock > 0)
                .map((g) => g.price);
            return prices.length > 0 ? Math.min(...prices) : Infinity;
        }),
    );
}
