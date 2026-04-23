import { describe, expect, it } from 'vitest';
import { convertConditionName, selectBestBookInfo } from '../bookLogic';
import type { BookInfo } from '../types';

describe('convertConditionName', () => {
    it('NEWを新品に変換する', () => {
        expect(convertConditionName('NEW')).toBe('新品');
    });

    it('VERY_GOODを非常に良いに変換する', () => {
        expect(convertConditionName('VERY_GOOD')).toBe('非常に良い');
    });

    it('GOODを良いに変換する', () => {
        expect(convertConditionName('GOOD')).toBe('良い');
    });

    it('ACCEPTABLEをキズや使用感ありに変換する', () => {
        expect(convertConditionName('ACCEPTABLE')).toBe('キズや使用感あり');
    });

    it('未知の状態名はそのまま返す', () => {
        expect(convertConditionName('UNKNOWN')).toBe('UNKNOWN');
    });
});

describe('selectBestBookInfo', () => {
    const makeBookInfo = (
        id: string,
        items: { condition: string; price: number; stock: number }[],
    ): BookInfo => ({
        vs_catalog_id: id,
        genpinList: items.map((i) => ({
            conditionName: i.condition,
            price: i.price,
            stock: i.stock,
        })),
    });

    it('単一の書籍情報はそのまま返す', () => {
        const book = makeBookInfo('A', [
            { condition: 'NEW', price: 1000, stock: 1 },
        ]);
        expect(selectBestBookInfo([book])).toBe(book);
    });

    it('新品在庫があるものを優先する', () => {
        const withNew = makeBookInfo('A', [
            { condition: 'NEW', price: 1000, stock: 1 },
        ]);
        const withoutNew = makeBookInfo('B', [
            { condition: 'GOOD', price: 300, stock: 5 },
        ]);
        expect(selectBestBookInfo([withoutNew, withNew])).toBe(withNew);
    });

    it('複数の新品がある場合は安い方を選ぶ', () => {
        const expensive = makeBookInfo('A', [
            { condition: 'NEW', price: 2000, stock: 1 },
        ]);
        const cheap = makeBookInfo('B', [
            { condition: 'NEW', price: 800, stock: 1 },
        ]);
        expect(selectBestBookInfo([expensive, cheap])).toBe(cheap);
    });

    it('新品が同価格なら出品状態が多い方を選ぶ', () => {
        const oneCondition = makeBookInfo('A', [
            { condition: 'NEW', price: 1000, stock: 1 },
        ]);
        const twoConditions = makeBookInfo('B', [
            { condition: 'NEW', price: 1000, stock: 1 },
            { condition: 'GOOD', price: 500, stock: 2 },
        ]);
        expect(selectBestBookInfo([oneCondition, twoConditions])).toBe(
            twoConditions,
        );
    });

    it('新品がない場合は最安値のものを選ぶ', () => {
        const expensive = makeBookInfo('A', [
            { condition: 'GOOD', price: 800, stock: 1 },
        ]);
        const cheap = makeBookInfo('B', [
            { condition: 'ACCEPTABLE', price: 200, stock: 1 },
        ]);
        expect(selectBestBookInfo([expensive, cheap])).toBe(cheap);
    });

    it('新品がなく同価格なら出品状態が多い方を選ぶ', () => {
        const one = makeBookInfo('A', [
            { condition: 'GOOD', price: 500, stock: 1 },
        ]);
        const two = makeBookInfo('B', [
            { condition: 'GOOD', price: 500, stock: 1 },
            { condition: 'ACCEPTABLE', price: 300, stock: 2 },
        ]);
        expect(selectBestBookInfo([one, two])).toBe(two);
    });

    it('新品が同価格・同状態数なら後のものを選ぶ', () => {
        const first = makeBookInfo('A', [
            { condition: 'NEW', price: 1000, stock: 1 },
        ]);
        const second = makeBookInfo('B', [
            { condition: 'NEW', price: 1000, stock: 1 },
        ]);
        expect(selectBestBookInfo([first, second])).toBe(second);
    });

    it('新品がなく先の方が安ければ先を選ぶ', () => {
        const cheap = makeBookInfo('A', [
            { condition: 'GOOD', price: 200, stock: 1 },
        ]);
        const expensive = makeBookInfo('B', [
            { condition: 'GOOD', price: 800, stock: 1 },
        ]);
        expect(selectBestBookInfo([cheap, expensive])).toBe(cheap);
    });

    it('在庫0のものは無視される', () => {
        const noStock = makeBookInfo('A', [
            { condition: 'NEW', price: 100, stock: 0 },
        ]);
        const hasStock = makeBookInfo('B', [
            { condition: 'GOOD', price: 500, stock: 1 },
        ]);
        expect(selectBestBookInfo([noStock, hasStock])).toBe(hasStock);
    });
});
