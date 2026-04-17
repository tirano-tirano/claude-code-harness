/**
 * 単体テストテンプレート
 *
 * このテンプレートを使用して、関数・ユーティリティの単体テストを作成する。
 * ファイル名: [対象ファイル名].test.ts
 *
 * ★重要ポイント:
 * - 具体的な値を検証する（toBeDefinedだけではダメ）
 * - 正常系・異常系・境界値を網羅する
 * - try-catchで両方OKにしない
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// テスト対象のインポート
// import { functionName } from '@/lib/module';

describe('functionName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // 正常系
  // ============================================

  describe('正常系', () => {
    it('基本的な使用方法', () => {
      // const result = functionName('input');
      // expect(result).toBe('expected');  // 具体的な値を検証
    });

    it('別のケース', () => {
      // const result = functionName('another-input');
      // expect(result).toBe('another-expected');
    });
  });

  // ============================================
  // 異常系
  // ============================================

  describe('異常系', () => {
    it('無効な入力でエラー', () => {
      // expect(() => functionName('invalid')).toThrow('Expected error message');
    });

    it('nullでエラー', () => {
      // expect(() => functionName(null)).toThrow('Input is required');
    });

    it('空文字でエラー', () => {
      // expect(() => functionName('')).toThrow('Input cannot be empty');
    });
  });

  // ============================================
  // 境界値
  // ============================================

  describe('境界値', () => {
    it('最小値で成功', () => {
      // const result = functionName(MIN_VALUE);
      // expect(result).toBe('expected-for-min');
    });

    it('最小値-1でエラー', () => {
      // expect(() => functionName(MIN_VALUE - 1)).toThrow('Below minimum');
    });

    it('最大値で成功', () => {
      // const result = functionName(MAX_VALUE);
      // expect(result).toBe('expected-for-max');
    });

    it('最大値+1でエラー', () => {
      // expect(() => functionName(MAX_VALUE + 1)).toThrow('Above maximum');
    });
  });

  // ============================================
  // エッジケース
  // ============================================

  describe('エッジケース', () => {
    it('特殊文字を含む入力', () => {
      // const result = functionName('test<script>');
      // expect(result).toBe('expected');
    });

    it('日本語を含む入力', () => {
      // const result = functionName('テスト');
      // expect(result).toBe('expected');
    });

    it('絵文字を含む入力', () => {
      // const result = functionName('👍');
      // expect(result).toBe('expected');
    });
  });
});

// ============================================
// 非同期関数のテスト例
// ============================================

describe('asyncFunctionName', () => {
  describe('正常系', () => {
    it('データを取得して変換する', async () => {
      // const result = await asyncFunctionName();
      // expect(result.id).toBe('expected-id');
      // expect(result.name).toBe('expected-name');
    });
  });

  describe('異常系', () => {
    it('無効な入力でエラー', async () => {
      // await expect(asyncFunctionName('invalid')).rejects.toThrow('Not found');
    });
  });
});

// ============================================
// 禁止パターン（絶対に書いてはいけない）
// ============================================

/*
// ❌ 禁止：try-catchで両方OKにする
it('データを取得する', async () => {
  try {
    const result = await fetchData();
    expect(result).toBeDefined();
  } catch (error) {
    expect(error).toBeDefined();  // エラーでもOK → 何も検証していない
  }
});

// ❌ 禁止：アサーションが弱い
it('何かを返す', () => {
  const result = functionName();
  expect(result).toBeDefined();  // 中身が間違っていても検出できない
});

// ❌ 禁止：テストを緩くして通す
// 失敗するテストの期待値を緩くするのは禁止
// 実装を修正すること
*/

// ============================================
// テスト作成後のチェックリスト
// ============================================

/*
□ 正常系のテストがあるか
□ 異常系のテストがあるか
□ 境界値のテストがあるか
□ 具体的な値を検証しているか
□ try-catchで両方OKにしていないか
*/
