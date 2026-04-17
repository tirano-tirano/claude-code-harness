# 意味のあるテストの書き方

**テストの目的は「コードが正しく動くことを検証する」こと。**
**「常にパスするテスト」は検証になっていない。**

## テストの価値とは

```
価値のあるテスト:
  ✅ コードが正しい時 → パスする
  ✅ コードが間違っている時 → 失敗する

価値のないテスト:
  ❌ コードが正しくても間違っていても → パスする
```

## 禁止パターン

### 1. try-catchで両方OKにする

```typescript
// ❌ 禁止：成功してもエラーでもパスする
it('データを取得する', async () => {
  try {
    const result = await fetchData();
    expect(result).toBeDefined();
  } catch (error) {
    expect(error).toBeDefined();  // エラーでもOK → 何も検証していない
  }
});
```

**なぜダメか:**
- fetchDataが成功しても失敗しても、このテストはパスする
- バグがあっても検出できない

**正しい書き方:**
```typescript
// ✅ 正常系と異常系を分ける
it('有効な条件でデータを取得できる', async () => {
  const result = await fetchData('valid-id');
  expect(result.id).toBe('valid-id');
  expect(result.name).toBe('Expected Name');
});

it('無効な条件でエラーになる', async () => {
  await expect(fetchData('invalid-id')).rejects.toThrow('Not found');
});
```

### 2. アサーションが弱すぎる

```typescript
// ❌ 禁止：存在確認だけ
it('ユーザーを取得する', async () => {
  const user = await getUser(1);
  expect(user).toBeDefined();  // 中身が間違っていても検出できない
});

// ❌ 禁止：型だけ確認
it('配列を返す', async () => {
  const items = await getItems();
  expect(Array.isArray(items)).toBe(true);  // 中身が空でも、間違っていてもOK
});
```

**正しい書き方:**
```typescript
// ✅ 具体的な値を検証
it('ID=1のユーザーを取得できる', async () => {
  const user = await getUser(1);
  expect(user.id).toBe(1);
  expect(user.name).toBe('山田太郎');
  expect(user.email).toBe('yamada@example.com');
});

// ✅ 配列の中身も検証
it('アクティブなアイテムを3件取得する', async () => {
  const items = await getActiveItems();
  expect(items).toHaveLength(3);
  expect(items[0].status).toBe('active');
  expect(items.every(item => item.status === 'active')).toBe(true);
});
```

### 3. アサーションがない

```typescript
// ❌ 禁止：何も検証していない
it('処理が完了する', async () => {
  await doSomething();
  // アサーションがない → エラーにならなければパス
});

// ❌ 禁止：console.logだけ
it('データを確認', async () => {
  const data = await getData();
  console.log(data);  // 目視確認は自動テストではない
});
```

**正しい書き方:**
```typescript
// ✅ 処理結果を検証
it('処理が完了し、状態が更新される', async () => {
  const before = await getStatus();
  expect(before).toBe('pending');

  await doSomething();

  const after = await getStatus();
  expect(after).toBe('completed');
});
```

### 4. 論理的に常にtrue

```typescript
// ❌ 禁止：常にtrueになる条件
it('値をチェックする', () => {
  const value = getValue();
  expect(value === null || value !== null).toBe(true);  // 常にtrue
});

// ❌ 禁止：何でもマッチする正規表現
it('文字列を返す', () => {
  const str = getString();
  expect(str).toMatch(/.*/);  // 空文字でもマッチ
});
```

### 5. エラーを握りつぶす

```typescript
// ❌ 禁止：エラーを無視
it('APIを呼ぶ', async () => {
  try {
    await callApi();
  } catch (e) {
    // 何もしない → 常にパス
  }
  expect(true).toBe(true);
});
```

### 6. テストを緩くして通す

```typescript
// ❌ 禁止：失敗するテストを緩くして通す

// 元のテスト（失敗する）
it('価格を計算する', () => {
  expect(calculatePrice(100, 0.1)).toBe(110);
});

// ❌ こういう「修正」は禁止
it('価格を計算する', () => {
  const result = calculatePrice(100, 0.1);
  expect(result).toBeDefined();  // 何でもOKにしてしまった
});

// ❌ これも禁止
it('価格を計算する', () => {
  try {
    expect(calculatePrice(100, 0.1)).toBe(110);
  } catch {
    // テストが失敗してもOK
  }
});
```

**正しい対応:**
```typescript
// ✅ 実装を修正する
// calculatePrice関数のバグを修正して、テストがパスするようにする

// もしくは、テストの期待値が間違っていたら
it('価格を計算する（税込）', () => {
  // 期待値を正しい値に修正
  expect(calculatePrice(100, 0.1)).toBe(110);
});
```

## テストを書く際のチェックリスト

### テストを書く前

- [ ] **このテストは何を検証するのか？** を言語化できるか
- [ ] **このテストが失敗するのはどんな時か？** を説明できるか

### テストを書いた後

- [ ] try-catchで成功もエラーも両方OKにしていないか
- [ ] アサーションは具体的な値を検証しているか
- [ ] アサーションが1つ以上あるか
- [ ] 論理的に常にtrueになる条件はないか
- [ ] エラーを握りつぶしていないか

### レビュー時

- [ ] このテストを緩くすることで通していないか
- [ ] 実装の問題をテストで隠蔽していないか

## E2Eテストでの注意点

E2Eテストでも同じ原則が適用される。

```typescript
// ❌ 禁止：ページが表示されるだけ
test('ホームページ', async ({ page }) => {
  await page.goto('/');
  // 何も検証していない
});

// ❌ 禁止：要素の存在だけ
test('ログインページ', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('form')).toBeVisible();  // 中身は？
});

// ✅ 正しい：具体的に検証
test('ログインページが正しく表示される', async ({ page }) => {
  await page.goto('/login');
  
  // フォームの構成要素を確認
  await expect(page.getByLabel('メールアドレス')).toBeVisible();
  await expect(page.getByLabel('パスワード')).toBeVisible();
  await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
  
  // タイトルを確認
  await expect(page).toHaveTitle(/ログイン/);
});

// ✅ 正しい：操作の結果を検証
test('ログインできる', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // 画面遷移を確認
  await expect(page).toHaveURL('/dashboard');
  
  // ログイン後の表示を確認
  await expect(page.getByText('ようこそ')).toBeVisible();
});
```

## 統合テストでの注意点

```typescript
// ❌ 禁止：ステータスコードだけ
it('APIが200を返す', async () => {
  const response = await GET(request);
  expect(response.status).toBe(200);  // 中身は？
});

// ✅ 正しい：レスポンスの内容も検証
it('ユーザー一覧を取得する', async () => {
  const response = await GET(request);
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body).toHaveLength(3);
  expect(body[0]).toMatchObject({
    id: expect.any(String),
    name: expect.any(String),
    email: expect.stringMatching(/@/),
  });
});

// ✅ 正しい：DBの変更も検証
it('ユーザーを作成する', async () => {
  const request = createRequest('POST', '/api/users', {
    body: { name: 'テスト', email: 'test@example.com' },
  });
  
  const response = await POST(request);
  const body = await response.json();

  // レスポンスを検証
  expect(response.status).toBe(201);
  expect(body.id).toBeDefined();

  // DBに実際に保存されたか検証
  const saved = await db.user.findUnique({ where: { id: body.id } });
  expect(saved).not.toBeNull();
  expect(saved.name).toBe('テスト');
  expect(saved.email).toBe('test@example.com');
});
```

## まとめ

| やるべきこと | やってはいけないこと |
|-------------|---------------------|
| 正常系と異常系を分ける | try-catchで両方OKにする |
| 具体的な値を検証する | toBeDefined()だけで終わる |
| 実装を修正する | テストを緩くして通す |
| DBの変更を確認する | レスポンスだけ見る |
| 操作の結果を検証する | 要素の存在だけ確認する |
