import { describe, expect, it } from 'vitest';
import { sanitizeISBN } from '../isbn';

describe('sanitizeISBN', () => {
    it('有効なISBN-13を返す', () => {
        expect(sanitizeISBN('978-4-06-516724-2')).toBe('978-4-06-516724-2');
    });

    it('ハイフンなしのISBN-13を返す', () => {
        expect(sanitizeISBN('9784065167242')).toBe('9784065167242');
    });

    it('ISBN-10を返す', () => {
        expect(sanitizeISBN('4065167248')).toBe('4065167248');
    });

    it('前後の空白を除去する', () => {
        expect(sanitizeISBN('  978-4-06-516724-2  ')).toBe('978-4-06-516724-2');
    });

    it('数字とハイフン以外の文字を除去する', () => {
        expect(sanitizeISBN('ISBN: 978-4-06-516724-2')).toBe(
            '978-4-06-516724-2',
        );
    });

    it('短すぎる文字列にはnullを返す', () => {
        expect(sanitizeISBN('12345')).toBeNull();
    });

    it('nullにはnullを返す', () => {
        expect(sanitizeISBN(null)).toBeNull();
    });

    it('undefinedにはnullを返す', () => {
        expect(sanitizeISBN(undefined)).toBeNull();
    });

    it('空文字列にはnullを返す', () => {
        expect(sanitizeISBN('')).toBeNull();
    });
});
