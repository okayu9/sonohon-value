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
 * バリューブックス検索拡張機能 - ISBN抽出
 * AmazonページのDOMからISBN情報を抽出します
 */

/**
 * ISBN文字列をサニタイズする
 * @param value 入力文字列
 * @returns サニタイズ済みISBN、無効な場合はnull
 */
export function sanitizeISBN(value?: string | null): string | null {
    if (!value) {
        return null;
    }
    const normalized = value.trim().replace(/[^0-9-]/g, '');
    return normalized.length >= 10 ? normalized : null;
}

/**
 * ページからISBNを取得する
 * @param doc 対象のドキュメント
 * @returns ISBN文字列、取得できない場合はnull
 */
export function getISBN(doc: Document): string | null {
    // 1. 商品詳細セクションの直接的なISBN表示を優先
    const directElement = doc.querySelector(
        '#rpi-attribute-book_details-isbn13 .rpi-attribute-value span',
    );
    const directIsbn = sanitizeISBN(directElement?.textContent);
    if (directIsbn) {
        return directIsbn;
    }

    // 2. 詳細テーブルのリスト内からテキストマッチングでISBN-13を探す
    const detailItems = Array.from(
        doc.querySelectorAll('#detailBullets_feature_div .a-list-item'),
    );
    for (const item of detailItems) {
        if (!item.textContent?.includes('ISBN-13')) {
            continue;
        }
        const candidateText =
            item.querySelector('span:last-child')?.textContent ??
            item.textContent;
        const isbn = sanitizeISBN(candidateText);
        if (isbn) {
            return isbn;
        }
    }

    // 3. 旧デザインのテーブル構造にも対応
    const tableItems = Array.from(
        doc.querySelectorAll('#productDetailsTable .content li'),
    );
    for (const item of tableItems) {
        if (!item.textContent?.includes('ISBN-13')) {
            continue;
        }
        const isbn = sanitizeISBN(item.textContent);
        if (isbn) {
            return isbn;
        }
    }

    return null;
}

/**
 * Kindleページから複数のISBNを取得する
 * @param doc 対象のドキュメント
 * @returns ISBN文字列の配列、取得できない場合は空配列
 */
export function getKindlePageISBNs(doc: Document): string[] {
    const isbns: string[] = [];

    try {
        // tmmSwatchesListの下にある紙書籍版へのリンクを探す
        const swatchesList = doc.getElementById('tmmSwatchesList');
        if (swatchesList) {
            // Kindle以外のフォーマット（紙書籍版）を探す
            const nonKindleFormats = Array.from(swatchesList.children).filter(
                (child) => child.id !== 'tmm-grid-swatch-KINDLE',
            );

            for (const format of nonKindleFormats) {
                // 紙書籍版へのリンクを探す
                const links = Array.from(
                    format.querySelectorAll('a[href*="/dp/"]'),
                );
                for (const link of links) {
                    const href = link.getAttribute('href');
                    if (href) {
                        // URLからISBN-10を抽出（/dp/数字9桁+[数字またはX]1桁 のパターン）
                        const match = href.match(/\/dp\/([0-9]{9}[0-9X])/);
                        if (match?.[1]) {
                            isbns.push(match[1]);
                        }
                    }
                }
            }
        }
    } catch (_e) {
        // 紙書籍版リンクからのISBN取得に失敗（非致命的）
    }

    return isbns;
}

/**
 * ページがKindleページかどうかを判定する
 * より厳密な判定を行うために複数の条件を組み合わせる
 * @param doc 対象のドキュメント
 * @returns Kindleページならtrue、そうでなければfalse
 */
export function isKindlePage(doc: Document): boolean {
    // 現在選択されているフォーマットがKindleかどうかを確認
    const selectedFormat = doc.querySelector('.swatchElement.selected');
    if (selectedFormat) {
        // 選択されているフォーマットのIDがKINDLEを含むか
        if (selectedFormat.id?.includes('KINDLE')) {
            return true;
        }

        // 選択されているフォーマットのテキストがKindleを含むか
        if (
            selectedFormat.textContent &&
            (selectedFormat.textContent.includes('Kindle') ||
                selectedFormat.textContent.includes('電子書籍'))
        ) {
            return true;
        }
    }

    // タイトルに「Kindle版」が明示的に含まれているか確認
    const title = doc.querySelector('#productTitle')?.textContent;
    if (
        title &&
        (title.includes('Kindle版') || title.includes('【Kindle版】'))
    ) {
        // タイトルにKindle版が含まれていても、他のフォーマットが選択されている場合は除外
        const otherFormatSelected = doc.querySelector(
            '.swatchElement.selected:not([id*="KINDLE"])',
        );
        if (!otherFormatSelected) {
            return true;
        }
    }

    // Kindleの購入ボタンが表示されているか確認
    const kindleBuyBox = doc.querySelector('#kindle-buy-box');
    if (kindleBuyBox) {
        return true;
    }

    // Kindleの価格表示があるか確認
    const kindlePrice = doc.querySelector('#kindle-price');
    if (kindlePrice) {
        return true;
    }

    // 上記のいずれの条件にも当てはまらない場合はKindleページではない
    return false;
}
