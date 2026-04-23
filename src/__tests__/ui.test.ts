/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// browserApi のモック
vi.mock('../browserApi', () => ({
    browserApi: {
        storage: {
            sync: {
                get: vi.fn(
                    (
                        _keys: string[],
                        callback: (result: Record<string, unknown>) => void,
                    ) => {
                        callback({ insertionLocation: 'default' });
                    },
                ),
            },
        },
        runtime: {
            sendMessage: vi.fn(),
        },
    },
}));

import type { BookInfo } from '../types';
import { displayError, displayVBAPriceInfo } from '../ui';

const sampleBookInfo: BookInfo = {
    vs_catalog_id: 'VS-12345',
    genpinList: [
        { conditionName: 'NEW', price: 1000, stock: 3 },
        { conditionName: 'GOOD', price: 500, stock: 1 },
        { conditionName: 'ACCEPTABLE', price: 300, stock: 0 },
    ],
};

beforeEach(() => {
    document.body.innerHTML = '';
});

describe('displayVBAPriceInfo', () => {
    it('在庫テーブルを挿入位置に表示する', async () => {
        document.body.innerHTML = '<div id="tellAmazon_feature_div"></div>';

        await displayVBAPriceInfo(sampleBookInfo, false);

        const info = document.getElementById('valuebooks-info');
        expect(info).not.toBeNull();
        expect(info?.textContent).toContain(
            'この本はバリューブックスにあります',
        );
    });

    it('在庫のある状態の価格を表示する', async () => {
        document.body.innerHTML = '<div id="tellAmazon_feature_div"></div>';

        await displayVBAPriceInfo(sampleBookInfo, false);

        const info = document.getElementById('valuebooks-info');
        expect(info?.textContent).toContain('1,000');
        expect(info?.textContent).toContain('500');
    });

    it('在庫切れの状態は「なし」と表示する', async () => {
        document.body.innerHTML = '<div id="tellAmazon_feature_div"></div>';

        await displayVBAPriceInfo(sampleBookInfo, true);

        const info = document.getElementById('valuebooks-info');
        expect(info?.textContent).toContain('なし');
    });

    it('showOutOfStock が true なら見出しが「在庫状況」になる', async () => {
        document.body.innerHTML = '<div id="tellAmazon_feature_div"></div>';

        await displayVBAPriceInfo(sampleBookInfo, true);

        const info = document.getElementById('valuebooks-info');
        expect(info?.textContent).toContain('バリューブックスの在庫状況');
    });

    it('バリューブックスへのリンクが正しい', async () => {
        document.body.innerHTML = '<div id="tellAmazon_feature_div"></div>';

        await displayVBAPriceInfo(sampleBookInfo, false);

        const link = document.querySelector(
            'a[href="https://www.valuebooks.jp/bp/VS-12345"]',
        );
        expect(link).not.toBeNull();
        expect(link?.getAttribute('target')).toBe('_blank');
    });

    it('全在庫0で showOutOfStock=false なら何も表示しない', async () => {
        document.body.innerHTML = '<div id="tellAmazon_feature_div"></div>';

        const noStockInfo: BookInfo = {
            vs_catalog_id: 'VS-99999',
            genpinList: [
                { conditionName: 'NEW', price: 1000, stock: 0 },
                { conditionName: 'GOOD', price: 500, stock: 0 },
            ],
        };

        await displayVBAPriceInfo(noStockInfo, false);

        const info = document.getElementById('valuebooks-info');
        expect(info).toBeNull();
    });

    it('全在庫0で showOutOfStock=true なら「なし」をテーブルに表示する', async () => {
        document.body.innerHTML = '<div id="tellAmazon_feature_div"></div>';

        const noStockInfo: BookInfo = {
            vs_catalog_id: 'VS-99999',
            genpinList: [{ conditionName: 'NEW', price: 1000, stock: 0 }],
        };

        await displayVBAPriceInfo(noStockInfo, true);

        const info = document.getElementById('valuebooks-info');
        expect(info).not.toBeNull();
        expect(info?.textContent).toContain('なし');
        expect(info?.textContent).toContain('バリューブックスの在庫状況');
    });

    it('既存の要素があれば削除して再描画する', async () => {
        document.body.innerHTML = `
            <div id="tellAmazon_feature_div"></div>
            <div><div id="valuebooks-info">古い情報</div></div>
        `;

        await displayVBAPriceInfo(sampleBookInfo, false);

        const infos = document.querySelectorAll('#valuebooks-info');
        expect(infos.length).toBe(1);
        expect(infos[0].textContent).toContain('1,000');
    });

    it('挿入候補が見つからない場合はエラーログを出す', async () => {
        document.body.innerHTML = '<div>候補なし</div>';
        const errorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await displayVBAPriceInfo(sampleBookInfo, false);

        expect(errorSpy).toHaveBeenCalledWith('挿入位置が見つかりませんでした');
        errorSpy.mockRestore();
    });
});

describe('displayError', () => {
    it('エラーメッセージをページ内に表示する', async () => {
        document.body.innerHTML = '<div id="tellAmazon_feature_div"></div>';

        await displayError('テストエラー');

        const errorEl = document.getElementById('valuebooks-error');
        expect(errorEl).not.toBeNull();
        expect(errorEl?.textContent).toContain('テストエラー');
        expect(errorEl?.textContent).toContain('その本、バリューにあるよ:');
    });

    it('既存のエラー要素を置き換える', async () => {
        document.body.innerHTML = `
            <div id="tellAmazon_feature_div"></div>
            <div><div id="valuebooks-error">古いエラー</div></div>
        `;

        await displayError('新しいエラー');

        const errors = document.querySelectorAll('#valuebooks-error');
        expect(errors.length).toBe(1);
        expect(errors[0].textContent).toContain('新しいエラー');
    });

    it('HTMLがエスケープされる', async () => {
        document.body.innerHTML = '<div id="tellAmazon_feature_div"></div>';

        await displayError('<script>alert("xss")</script>');

        const errorEl = document.getElementById('valuebooks-error');
        expect(errorEl?.innerHTML).not.toContain('<script>');
        expect(errorEl?.textContent).toContain('<script>');
    });
});
