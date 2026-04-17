# 単体テストガイド

**単体テストは、統合テスト・E2Eテストを支える土台。**
**個々のロジックが正しく動作することを確認する。**

## 単体テストの位置づけ

```
E2E（受け入れテスト）← ゴール
    │
    └─→ 統合テスト
            │
            └─→ 単体テスト ← 今ここ
                    │
                    │  個々のロジックが正しい
```

## 単体テストの対象

| 対象 | 優先度 | 例 |
|------|--------|-----|
| バリデーションロジック | 高 | メールアドレス検証、パスワード強度チェック |
| 計算・変換ロジック | 高 | 価格計算、日付フォーマット |
| ユーティリティ関数 | 中 | 文字列操作、配列操作 |
| カスタムフック | 中 | useCounter、useForm |
| 純粋なコンポーネント | 低 | 表示のみのコンポーネント（E2E/ビジュアルテストで代替可） |

## 基本構造

```typescript
import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword } from '@/lib/validation';

describe('validateEmail', () => {
  describe('正常系', () => {
    it('有効なメールアドレスでtrueを返す', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('user.name@example.co.jp')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });
  });

  describe('異常系', () => {
    it('@がないとfalseを返す', () => {
      expect(validateEmail('userexample.com')).toBe(false);
    });

    it('ドメインがないとfalseを返す', () => {
      expect(validateEmail('user@')).toBe(false);
    });

    it('空文字でfalseを返す', () => {
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('エッジケース', () => {
    it('日本語ドメインでtrueを返す', () => {
      expect(validateEmail('user@日本語.jp')).toBe(true);
    });

    it('最大長のメールアドレスでtrueを返す', () => {
      const longLocal = 'a'.repeat(64);
      const longDomain = 'b'.repeat(63) + '.com';
      expect(validateEmail(`${longLocal}@${longDomain}`)).toBe(true);
    });
  });
});
```

## 意味のあるテストを書く

### 禁止パターン

```typescript
// ❌ 禁止：成功してもエラーでもパスする
it('関数が動く', () => {
  try {
    const result = myFunction();
    expect(result).toBeDefined();
  } catch (error) {
    expect(error).toBeDefined();
  }
});

// ❌ 禁止：アサーションが弱い
it('何かを返す', () => {
  const result = myFunction();
  expect(result).toBeDefined();  // 中身が間違っていても検出できない
});

// ❌ 禁止：テストを緩くして通す
it('計算する', () => {
  const result = calculate(100, 0.1);
  expect(result).toBeDefined();  // 本来は expect(result).toBe(110)
});
```

### 正しいパターン

```typescript
// ✅ 具体的な値を検証
it('税込価格を計算する', () => {
  expect(calculateWithTax(100, 0.1)).toBe(110);
  expect(calculateWithTax(1000, 0.1)).toBe(1100);
  expect(calculateWithTax(0, 0.1)).toBe(0);
});

// ✅ 異常系は別のテストで
it('負の価格でエラーをスローする', () => {
  expect(() => calculateWithTax(-100, 0.1)).toThrow('価格は0以上');
});

// ✅ 境界値を明確にテスト
it('税率0%で元の価格を返す', () => {
  expect(calculateWithTax(100, 0)).toBe(100);
});

it('税率100%で2倍の価格を返す', () => {
  expect(calculateWithTax(100, 1)).toBe(200);
});
```

## ユーティリティ関数のテスト

```typescript
// 対象: src/lib/format.ts
export function formatPrice(price: number): string {
  if (price < 0) {
    return `-¥${Math.abs(price).toLocaleString()}`;
  }
  return `¥${price.toLocaleString()}`;
}

// テスト: __tests__/lib/format.test.ts
describe('formatPrice', () => {
  it('正の数を日本円形式でフォーマットする', () => {
    expect(formatPrice(1000)).toBe('¥1,000');
    expect(formatPrice(1234567)).toBe('¥1,234,567');
  });

  it('0を正しくフォーマットする', () => {
    expect(formatPrice(0)).toBe('¥0');
  });

  it('負の数を正しくフォーマットする', () => {
    expect(formatPrice(-1000)).toBe('-¥1,000');
  });

  it('小数を正しくフォーマットする', () => {
    expect(formatPrice(1000.5)).toBe('¥1,000.5');
  });
});
```

## バリデーション関数のテスト

```typescript
// 対象: src/lib/validation.ts
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('8文字以上必要です');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('大文字を含めてください');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('数字を含めてください');
  }
  
  return { valid: errors.length === 0, errors };
}

// テスト
describe('validatePassword', () => {
  describe('正常系', () => {
    it('すべての条件を満たすパスワードで有効', () => {
      const result = validatePassword('SecurePass123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('異常系', () => {
    it('8文字未満でエラー', () => {
      const result = validatePassword('Short1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('8文字以上必要です');
    });

    it('大文字なしでエラー', () => {
      const result = validatePassword('lowercase123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('大文字を含めてください');
    });

    it('数字なしでエラー', () => {
      const result = validatePassword('NoNumbers');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('数字を含めてください');
    });

    it('複数の条件違反で複数エラー', () => {
      const result = validatePassword('short');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });

  describe('境界値', () => {
    it('ちょうど8文字で有効', () => {
      const result = validatePassword('Abcdefg1');
      expect(result.valid).toBe(true);
    });

    it('7文字で無効', () => {
      const result = validatePassword('Abcdef1');
      expect(result.valid).toBe(false);
    });
  });
});
```

## カスタムフックのテスト

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '@/hooks/useCounter';

describe('useCounter', () => {
  it('初期値を設定できる', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('デフォルトの初期値は0', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('incrementでカウントが増える', () => {
    const { result } = renderHook(() => useCounter(0));
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });

  it('decrementでカウントが減る', () => {
    const { result } = renderHook(() => useCounter(5));
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(4);
  });

  it('resetで初期値に戻る', () => {
    const { result } = renderHook(() => useCounter(10));
    
    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });
    
    expect(result.current.count).toBe(10);
  });
});
```

## 非同期関数のテスト

```typescript
import { describe, it, expect, vi } from 'vitest';
import { fetchUserData } from '@/lib/api';

// 外部依存はモック（実DBは使わない）
vi.mock('@/lib/http', () => ({
  httpClient: {
    get: vi.fn(),
  },
}));

import { httpClient } from '@/lib/http';

describe('fetchUserData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ユーザーデータを取得して変換する', async () => {
    // モックの設定
    vi.mocked(httpClient.get).mockResolvedValue({
      data: { id: 1, name: 'Test User', email: 'test@example.com' }
    });

    // 実行
    const result = await fetchUserData(1);

    // 検証
    expect(httpClient.get).toHaveBeenCalledWith('/users/1');
    expect(result).toEqual({
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      displayName: 'Test User',  // 変換されたフィールド
    });
  });

  it('存在しないIDでエラーをスローする', async () => {
    vi.mocked(httpClient.get).mockRejectedValue(new Error('Not found'));

    await expect(fetchUserData(999)).rejects.toThrow('Not found');
  });
});
```

## コンポーネントのテスト（必要な場合のみ）

**注意: 単純な表示コンポーネントはE2E/ビジュアルテストでカバーできる。**
**複雑なロジックを持つコンポーネントのみ単体テストを書く。**

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from '@/components/Counter';

describe('Counter', () => {
  it('初期値を表示する', () => {
    render(<Counter initialValue={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('+ボタンでカウントが増える', async () => {
    const user = userEvent.setup();
    render(<Counter initialValue={0} />);
    
    await user.click(screen.getByRole('button', { name: '+' }));
    
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('-ボタンでカウントが減る', async () => {
    const user = userEvent.setup();
    render(<Counter initialValue={5} />);
    
    await user.click(screen.getByRole('button', { name: '-' }));
    
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('onChange コールバックが呼ばれる', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Counter initialValue={0} onChange={handleChange} />);
    
    await user.click(screen.getByRole('button', { name: '+' }));
    
    expect(handleChange).toHaveBeenCalledWith(1);
  });
});
```

## テスト実行コマンド

```bash
# 全テスト実行
npm run test

# 特定ファイルのテスト
npm run test -- validation.test.ts

# 特定パターンにマッチするテスト
npm run test -- --grep "validateEmail"

# ウォッチモード
npm run test -- --watch

# カバレッジ付き
npm run test -- --coverage
```

## チェックリスト

### テスト実装時
- [ ] 正常系・異常系・エッジケースをカバーしているか
- [ ] 具体的な値を検証しているか（toBeDefinedだけではない）
- [ ] 境界値をテストしているか
- [ ] エラーメッセージも検証しているか

### テスト設計時
- [ ] この関数は単体テストが必要か？（統合テスト/E2Eで十分ではないか）
- [ ] モックが多すぎないか？（実装の詳細をテストしていないか）
- [ ] テストが壊れやすくないか？（実装の変更で壊れないか）
