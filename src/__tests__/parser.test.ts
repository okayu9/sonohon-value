import { describe, expect, it } from 'vitest';
import {
    decodeAndParse,
    extractBookInfo,
    extractFromNuxtData,
} from '../parser';
import type { BookInfo } from '../types';

const sampleBookInfo: BookInfo = {
    vs_catalog_id: 'VS-12345',
    genpinList: [
        { conditionName: 'NEW', price: 1000, stock: 3 },
        { conditionName: 'GOOD', price: 500, stock: 1 },
    ],
};

describe('decodeAndParse', () => {
    it('プレーンなJSON文字列をパースできる', () => {
        const json = JSON.stringify(sampleBookInfo);
        expect(decodeAndParse(json)).toEqual(sampleBookInfo);
    });

    it('HTMLエンコードされたJSON文字列をデコードしてパースできる', () => {
        const encoded = JSON.stringify(sampleBookInfo)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;');
        expect(decodeAndParse(encoded)).toEqual(sampleBookInfo);
    });

    it('不正なJSONの場合はエラーを投げる', () => {
        expect(() => decodeAndParse('not-json')).toThrow();
    });

    it('BookInfo構造を持たないJSONの場合はエラーを投げる', () => {
        const invalidJson = JSON.stringify({ foo: 'bar' });
        expect(() => decodeAndParse(invalidJson)).toThrow(
            '書籍情報の形式が不正です',
        );
    });

    it('genpinListの要素が不正な場合はエラーを投げる', () => {
        const invalidJson = JSON.stringify({
            vs_catalog_id: 'VS-1',
            genpinList: [{ conditionName: 'NEW' }],
        });
        expect(() => decodeAndParse(invalidJson)).toThrow(
            '書籍情報の形式が不正です',
        );
    });
});

describe('extractBookInfo', () => {
    it('router-viewのitem-info属性から書籍情報を抽出できる', () => {
        const encoded = JSON.stringify(sampleBookInfo).replace(/"/g, '&quot;');
        const html = `<div><router-view :item-info="${encoded}" /></div>`;
        expect(extractBookInfo(html)).toEqual(sampleBookInfo);
    });

    it('__NUXT__データから書籍情報を抽出できる', () => {
        const nuxtData = {
            state: {
                search: {
                    items: [sampleBookInfo],
                },
            },
        };
        const html = `<script>window.__NUXT__ = ${JSON.stringify(nuxtData)}</script>`;
        expect(extractBookInfo(html)).toEqual(sampleBookInfo);
    });

    it('NUXTデータも不正な場合は書籍情報が見つからないエラーを投げる', () => {
        const html =
            '<script>window.__NUXT__ = {"state": {"search": {"items": []}}}</script>';
        expect(() => extractBookInfo(html)).toThrow(
            '書籍情報が見つかりませんでした',
        );
    });

    it('書籍情報が見つからない場合はエラーを投げる', () => {
        expect(() => extractBookInfo('<html><body></body></html>')).toThrow(
            '書籍情報が見つかりませんでした',
        );
    });
});

describe('extractFromNuxtData', () => {
    it('正しいNUXTデータ構造から書籍情報を抽出できる', () => {
        const nuxtData = JSON.stringify({
            state: { search: { items: [sampleBookInfo] } },
        });
        expect(extractFromNuxtData(nuxtData)).toEqual(sampleBookInfo);
    });

    it('itemsが空の場合はエラーを投げる', () => {
        const nuxtData = JSON.stringify({
            state: { search: { items: [] } },
        });
        expect(() => extractFromNuxtData(nuxtData)).toThrow();
    });

    it('search構造がない場合はエラーを投げる', () => {
        const nuxtData = JSON.stringify({ state: {} });
        expect(() => extractFromNuxtData(nuxtData)).toThrow();
    });

    it('プロパティ値のundefinedをnullに置換してパースできる', () => {
        const nuxtStr = `{"state": {"search": {"items": [{"vs_catalog_id": "VS-1", "genpinList": [{"conditionName": "NEW", "price": 100, "stock": 1}]}]}, "other": undefined}}`;
        const result = extractFromNuxtData(nuxtStr);
        expect(result.vs_catalog_id).toBe('VS-1');
    });

    it('BookInfo構造を持たないitemsはスキップされる', () => {
        const nuxtData = JSON.stringify({
            state: {
                search: {
                    items: [{ invalid: true }, sampleBookInfo],
                },
            },
        });
        expect(extractFromNuxtData(nuxtData)).toEqual(sampleBookInfo);
    });

    it('不正なJSONの場合はデータ解析エラーを投げる', () => {
        expect(() => extractFromNuxtData('not valid json')).toThrow(
            'データ解析に失敗しました',
        );
    });

    it('BookInfo構造を持つitemがない場合はエラーを投げる', () => {
        const nuxtData = JSON.stringify({
            state: {
                search: {
                    items: [{ invalid: true }, { also: 'invalid' }],
                },
            },
        });
        expect(() => extractFromNuxtData(nuxtData)).toThrow();
    });
});
