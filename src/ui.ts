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
 * バリューブックス検索拡張機能 - UI生成
 * Amazonページに挿入するHTML要素の生成とDOM操作を担当します
 */

import { convertConditionName } from './bookLogic';
import { browserApi } from './browserApi';
import { type BookInfo, InsertionLocation, type InsertionPoint } from './types';

/**
 * HTML文字列をエスケープする
 */
function escapeHTML(str: string): string {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

/**
 * 挿入位置オプションを取得する
 */
function getInsertionLocation(): Promise<InsertionLocation> {
    return new Promise((resolve) => {
        browserApi.storage.sync.get(['insertionLocation'], (result) => {
            resolve(result.insertionLocation || InsertionLocation.DEFAULT);
        });
    });
}

/**
 * 指定IDの要素の親と参照ノードから挿入位置を返す
 * 要素が見つからない場合はnullを返す
 */
function insertionPointById(
    id: string,
    referencePosition: 'before' | 'after' = 'after',
): InsertionPoint | null {
    const element = document.getElementById(id);
    if (!element?.parentNode) {
        return null;
    }
    return {
        parent: element.parentNode as HTMLElement,
        reference:
            referencePosition === 'before' ? element : element.nextSibling,
    };
}

/**
 * 要素を挿入する場所を特定する
 * @returns 挿入位置情報のPromise、見つからない場合はnull
 */
async function findInsertionPoint(): Promise<InsertionPoint | null> {
    const insertionLocation = await getInsertionLocation();

    switch (insertionLocation) {
        case InsertionLocation.BETWEEN_REVIEWS_DESCRIPTION: {
            return (
                insertionPointById('bookDescription_feature_div', 'before') ||
                insertionPointById(
                    'richProductInformation_feature_div',
                    'before',
                ) ||
                insertionPointById('averageCustomerReviews_feature_div')
            );
        }

        case InsertionLocation.BELOW_DETAILS: {
            return insertionPointById('richProductInformation_feature_div');
        }

        default: {
            const candidateIds = [
                'tellAmazon_feature_div',
                'bookDescription_feature_div',
                'detailBullets_feature_div',
                'productDetails_feature_div',
                'detailBulletsWrapper_feature_div',
            ];

            for (const id of candidateIds) {
                const point = insertionPointById(id);
                if (point) {
                    return point;
                }
            }
            break;
        }
    }

    return null;
}

/**
 * 要素を挿入する
 */
async function insertElement(element: HTMLElement): Promise<boolean> {
    const insertionPoint = await findInsertionPoint();
    if (insertionPoint) {
        insertionPoint.parent.insertBefore(element, insertionPoint.reference);
        return true;
    }
    console.error('挿入位置が見つかりませんでした');
    return false;
}

/**
 * 価格情報のHTML文字列を生成する
 */
function createPriceInfoHTML(
    priceInfo: BookInfo,
    showOutOfStock: boolean,
    insertionLocation: InsertionLocation,
): string {
    const stockStatusText = showOutOfStock
        ? 'バリューブックスの在庫状況'
        : 'この本はバリューブックスにあります';

    const hasStock = priceInfo.genpinList.some((genpin) => genpin.stock > 0);

    // 挿入位置に応じてHRタグの配置を決定
    let topHR = '';
    let bottomHR = '';

    if (insertionLocation === InsertionLocation.BELOW_DETAILS) {
        topHR = '<hr>';
        bottomHR = '<hr>';
    } else if (
        insertionLocation === InsertionLocation.BETWEEN_REVIEWS_DESCRIPTION
    ) {
        bottomHR = '<hr>';
    } else {
        topHR = '<hr>';
    }

    const styles = {
        container: 'margin: 10px 0; padding: 0 0 5px; width: auto;',
        header: 'font-weight: bold; color: rgb(200, 100, 0); margin: 0 10px;',
        optionLink: 'color: #007185; margin-left: 10px; font-size: smaller;',
        table: 'margin: 5px 0 0; width: auto; table-layout: auto; border-collapse: collapse;',
        th: 'white-space: nowrap; padding: 5px 10px; font-size: smaller; text-align: center; border-bottom: 1px solid #eee;',
        td: 'white-space: nowrap; padding: 5px 10px; font-size: smaller; text-align: center;',
        link: 'margin: 5px 0 0; padding: 5px 10px;',
        linkText: 'color: #007185;',
    };

    return `
        <div style="${styles.container}" id="valuebooks-info">
            ${topHR}
            <p style="${styles.header}">
                ${stockStatusText} <a href="#" id="open-options" style="${styles.optionLink}">オプション</a>
            </p>
            ${
                hasStock || showOutOfStock
                    ? `
            <table style="${styles.table}">
                <thead>
                    <tr>
                        ${priceInfo.genpinList
                            .map(
                                (genpin) =>
                                    `<th style="${styles.th}">${escapeHTML(convertConditionName(genpin.conditionName))}</th>`,
                            )
                            .join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        ${priceInfo.genpinList
                            .map(
                                (genpin) =>
                                    `<td style="${styles.td}">${
                                        genpin.stock > 0
                                            ? `<strong>${escapeHTML(genpin.price.toLocaleString())} 円</strong>`
                                            : '<span style="color: #999;">なし</span>'
                                    }</td>`,
                            )
                            .join('')}
                    </tr>
                </tbody>
            </table>
            `
                    : '<p style="margin: 5px 10px; color: #999;">現在バリューブックスに在庫がありません</p>'
            }
            <p style="${styles.link}">
                <a href="https://www.valuebooks.jp/bp/${escapeHTML(priceInfo.vs_catalog_id)}"
                   target="_blank" rel="noopener noreferrer" style="${styles.linkText}">
                   バリューブックスに移動する
                </a>
            </p>
            ${bottomHR}
        </div>
    `;
}

/**
 * 価格情報を表示する
 */
export async function displayVBAPriceInfo(
    priceInfo: BookInfo,
    showOutOfStock: boolean,
): Promise<void> {
    const insertionLocation = await getInsertionLocation();
    if (
        !showOutOfStock &&
        priceInfo.genpinList.every((genpin) => genpin.stock === 0)
    ) {
        return;
    }

    // 既存の要素があれば削除（ページ更新時の重複防止）
    const existingElement = document.getElementById('valuebooks-info');
    if (existingElement?.parentNode) {
        existingElement.parentNode.removeChild(existingElement);
    }

    const element = document.createElement('div');
    element.innerHTML = createPriceInfoHTML(
        priceInfo,
        showOutOfStock,
        insertionLocation,
    );

    const inserted = await insertElement(element);
    if (inserted) {
        document
            .getElementById('open-options')
            ?.addEventListener('click', (e) => {
                e.preventDefault();
                browserApi.runtime.sendMessage({ action: 'openOptionsPage' });
            });
    }
}

/**
 * エラー情報をページ内にインライン表示する
 */
export async function displayError(message: string): Promise<void> {
    console.error(message);

    const existing = document.getElementById('valuebooks-error');
    if (existing?.parentNode) {
        existing.parentNode.removeChild(existing);
    }

    const element = document.createElement('div');
    element.innerHTML = `
        <div id="valuebooks-error" style="margin: 10px 0; padding: 8px 12px; color: #856404; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 4px; font-size: smaller;">
            <hr>
            <strong>その本、バリューにあるよ:</strong> ${escapeHTML(message)}
        </div>
    `;

    await insertElement(element);
}
