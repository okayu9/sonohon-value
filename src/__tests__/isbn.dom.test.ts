/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { getISBN, getKindlePageISBNs, isKindlePage } from '../isbn';

describe('getISBN', () => {
    it('rpi-attribute から ISBN-13 を取得できる', () => {
        document.body.innerHTML = `
            <div id="rpi-attribute-book_details-isbn13">
                <div class="rpi-attribute-value"><span>978-4-06-516724-2</span></div>
            </div>
        `;
        expect(getISBN(document)).toBe('978-4-06-516724-2');
    });

    it('detailBullets から ISBN-13 を取得できる', () => {
        document.body.innerHTML = `
            <div id="detailBullets_feature_div">
                <div class="a-list-item">
                    <span>ISBN-13</span>
                    <span>978-4065167242</span>
                </div>
            </div>
        `;
        expect(getISBN(document)).toBe('978-4065167242');
    });

    it('productDetailsTable から ISBN-13 を取得できる', () => {
        document.body.innerHTML = `
            <div id="productDetailsTable">
                <div class="content">
                    <li>ISBN-13: <span>978-4065167242</span></li>
                </div>
            </div>
        `;
        // sanitizeISBN はテキスト全体から数字とハイフンを抽出する
        // "ISBN-13: 978-..." → "-13978-..." となるが長さ >= 10 なので通る
        expect(getISBN(document)).toBe('-13978-4065167242');
    });

    it('ISBN が見つからない場合は null を返す', () => {
        document.body.innerHTML = '<div>No ISBN here</div>';
        expect(getISBN(document)).toBeNull();
    });

    it('短すぎる数字は null を返す', () => {
        document.body.innerHTML = `
            <div id="rpi-attribute-book_details-isbn13">
                <div class="rpi-attribute-value"><span>12345</span></div>
            </div>
        `;
        expect(getISBN(document)).toBeNull();
    });
});

describe('isKindlePage', () => {
    it('Kindle フォーマットが選択されている場合は true', () => {
        document.body.innerHTML = `
            <div class="swatchElement selected" id="tmm-grid-swatch-KINDLE">Kindle</div>
        `;
        expect(isKindlePage(document)).toBe(true);
    });

    it('テキストに Kindle を含む選択フォーマットで true', () => {
        document.body.innerHTML = `
            <div class="swatchElement selected">Kindle版</div>
        `;
        expect(isKindlePage(document)).toBe(true);
    });

    it('電子書籍テキストで true', () => {
        document.body.innerHTML = `
            <div class="swatchElement selected">電子書籍</div>
        `;
        expect(isKindlePage(document)).toBe(true);
    });

    it('kindle-buy-box がある場合は true', () => {
        document.body.innerHTML = '<div id="kindle-buy-box"></div>';
        expect(isKindlePage(document)).toBe(true);
    });

    it('kindle-price がある場合は true', () => {
        document.body.innerHTML = '<div id="kindle-price">¥500</div>';
        expect(isKindlePage(document)).toBe(true);
    });

    it('紙書籍が選択されている場合は false', () => {
        document.body.innerHTML = `
            <div class="swatchElement selected" id="tmm-grid-swatch-PAPERBACK">単行本</div>
        `;
        expect(isKindlePage(document)).toBe(false);
    });

    it('何も選択されていない場合は false', () => {
        document.body.innerHTML = '<div>普通のページ</div>';
        expect(isKindlePage(document)).toBe(false);
    });

    it('タイトルにKindle版があっても他フォーマット選択時は false', () => {
        document.body.innerHTML = `
            <span id="productTitle">テスト本 Kindle版</span>
            <div class="swatchElement selected" id="tmm-grid-swatch-PAPERBACK">単行本</div>
        `;
        expect(isKindlePage(document)).toBe(false);
    });
});

describe('getKindlePageISBNs', () => {
    it('紙書籍版リンクから ISBN-10 を取得できる', () => {
        document.body.innerHTML = `
            <ul id="tmmSwatchesList">
                <li id="tmm-grid-swatch-KINDLE">
                    <a href="/dp/B01234567X">Kindle</a>
                </li>
                <li id="tmm-grid-swatch-PAPERBACK">
                    <a href="/dp/4065167248">単行本</a>
                </li>
                <li id="tmm-grid-swatch-HARDCOVER">
                    <a href="/dp/406516724X">ハードカバー</a>
                </li>
            </ul>
        `;
        const isbns = getKindlePageISBNs(document);
        expect(isbns).toEqual(['4065167248', '406516724X']);
    });

    it('tmmSwatchesList がない場合は空配列を返す', () => {
        document.body.innerHTML = '<div>No swatches</div>';
        expect(getKindlePageISBNs(document)).toEqual([]);
    });

    it('Kindle 以外のフォーマットがない場合は空配列を返す', () => {
        document.body.innerHTML = `
            <ul id="tmmSwatchesList">
                <li id="tmm-grid-swatch-KINDLE">
                    <a href="/dp/B01234567X">Kindle</a>
                </li>
            </ul>
        `;
        expect(getKindlePageISBNs(document)).toEqual([]);
    });
});
