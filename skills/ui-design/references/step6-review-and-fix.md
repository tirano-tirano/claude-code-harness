# Step 6: 実装後の確認と修正

## このステップのゴール

実装したUIを**実際に見て確認し、問題があれば修正する**。

ルール通りに実装したつもりでも、実際に見ると問題が見つかることが多い。
**必ずスクリーンショットで確認してから完了とすること。**

---

## 確認のワークフロー

```
実装完了
  ↓
スクリーンショットを撮る
  ↓
チェックリストで確認
  ↓
問題を特定
  ↓
修正
  ↓
再度スクリーンショットで確認
  ↓
問題がなくなるまで繰り返す
```

---

## スクリーンショットの撮り方

### 方法1: Playwright を使う（推奨）

```typescript
// screenshot.ts
import { chromium } from 'playwright';

async function takeScreenshot() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // ビューポートサイズを設定
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  // ページにアクセス
  await page.goto('http://localhost:3000');
  
  // 少し待機（レンダリング完了を待つ）
  await page.waitForTimeout(1000);
  
  // スクリーンショットを撮る
  await page.screenshot({ 
    path: 'screenshot-full.png',
    fullPage: true  // ページ全体
  });
  
  // ダークモードも確認
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: 'screenshot-dark.png', fullPage: true });
  
  await browser.close();
}

takeScreenshot();
```

### 方法2: 手動でブラウザから

1. 開発サーバーを起動（`npm run dev`）
2. ブラウザで開く
3. 開発者ツール → デバイスツールバー → 画面サイズを設定
4. スクリーンショットを撮る（Cmd+Shift+4 など）

### 方法3: Claude Code で確認を依頼

```
「このページのスクリーンショットを撮って、デザインルールに違反している箇所を指摘してください」
```

---

## 確認すべき画面サイズ

| サイズ | 幅 | 用途 |
|--------|-----|------|
| デスクトップ（大） | 1920px | 大画面モニター |
| デスクトップ（標準） | 1440px | 一般的なノートPC |
| デスクトップ（小） | 1280px | 小さいノートPC |
| タブレット | 768px | iPad など |
| モバイル | 375px | iPhone など |

**最低でもデスクトップ（標準）1440px で確認すること。**

---

## 確認チェックリスト

スクリーンショットを見ながら、以下を確認する。

### 1. 全体の印象（まず直感で）

- [ ] 「窮屈」に見えないか？
- [ ] 「スカスカ」すぎないか？
- [ ] 「ゴチャゴチャ」していないか？
- [ ] 「安っぽく」見えないか？
- [ ] 「プロが作った」ように見えるか？

### 2. 背景色と階層

- [ ] ページ背景は真っ白・真っ黒になっていないか？
- [ ] サイドバー、ヘッダー、コンテンツが視覚的に区別できるか？
- [ ] ダークモードで「真っ黒」になっていないか？

### 3. 境界線

- [ ] ヘッダーの下に境界線があるか？
- [ ] サイドバーの右に境界線があるか？
- [ ] 境界線は薄いグレーか？（黒い線になっていないか）

### 4. ヘッダー

- [ ] 高さは十分か？（h-14/h-16 = 56px/64px）
- [ ] ロゴとユーザーメニューの間に十分な余白があるか？
- [ ] 要素が上下中央に揃っているか？

### 5. サイドバー

- [ ] 幅は十分か？（w-64 = 256px 以上）
- [ ] メニュー項目が詰まって見えないか？
- [ ] セクション見出しがあるか？
- [ ] セクション間に十分な余白があるか？
- [ ] 選択中の項目が分かるか？
- [ ] アイコンとテキストの間に余白があるか？

### 6. タブ

- [ ] 選択中のタブと非選択のタブの違いが明確か？
- [ ] タブとコンテンツの間に十分な余白があるか？

### 7. コンテンツエリア

- [ ] 左右に十分なパディングがあるか？
- [ ] カード内に十分なパディングがあるか？
- [ ] カード間に十分な余白があるか？

### 8. Empty State（データがない場合）

- [ ] ただのテキストだけになっていないか？
- [ ] 中央に配置されているか？
- [ ] アイコンがあるか？
- [ ] 次のアクションが分かるか？

### 9. 統計・サマリー表示

- [ ] 各項目間に十分な余白があるか？
- [ ] 下のコンテンツとの間に十分な余白があるか？

### 10. 複雑なコンポーネント（フィルター、ツールバー、プレイヤーなど）

**原則1: グループ化**
- [ ] 関連する要素がグループとしてまとまっているか？
- [ ] グループ内は gap-2〜gap-3（狭い）か？
- [ ] グループ間は gap-6〜gap-8（広い）か？

**原則2: 優先順位**
- [ ] 重要な要素が目立つ位置（左または中央）にあるか？
- [ ] 使用頻度が低いものは端、折りたたみ、または別の行にあるか？

**原則3: ゾーン配置**
- [ ] 要素がゾーン（左・中央・右など）に分かれているか？
- [ ] 各ゾーンに明確な役割があるか？

**原則4: 複数行**
- [ ] 1行に詰め込みすぎていないか？
- [ ] 要素が多い場合、2行構成を検討したか？

**原則5: 幅の統一**
- [ ] 入力欄の幅が統一されているか？（w-16, w-20, w-24 など）
- [ ] ドロップダウンの幅が統一されているか？（w-32, w-40 など）
- [ ] 横一列に並んだとき、ガタガタに見えないか？

**原則6: 最小サイズ**
- [ ] 1行構成のバーは h-14 以上か？
- [ ] 2行構成のバーは h-20〜h-24 か？
- [ ] パディングは px-6 py-4 以上か？

### 11. テーブル

- [ ] 行の高さは十分か？（py-3 以上）
- [ ] ヘッダーと本体が視覚的に区別できるか？
- [ ] 列幅が適切か？（チェックボックス列は w-12 など固定）

---

## よくある問題と修正方法

### 問題1: 全体的に窮屈に見える

**原因**: 余白が足りない

**修正方法**:
```diff
- <div className="p-4">
+ <div className="p-6">

- <div className="gap-4">
+ <div className="gap-6">

- <div className="mt-4">
+ <div className="mt-6">
```

### 問題2: サイドバーのメニューが詰まっている

**原因**: メニュー項目のパディングとセクション間の余白が足りない

**修正方法**:
```diff
// メニュー項目
- <a className="px-2 py-1">
+ <a className="px-3 py-2">

// セクション間
- <div className="mt-2">
+ <div className="mt-6">

// セクション見出し
- <h3 className="text-sm mb-1">
+ <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-2">
```

### 問題3: ヘッダーとコンテンツの区別がつかない

**原因**: 境界線がない、または背景色が同じ

**修正方法**:
```diff
- <header className="px-6 py-4">
+ <header className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
```

### 問題4: タブとコンテンツが近すぎる

**原因**: タブリストとコンテンツの間の余白が足りない

**修正方法**:
```diff
- <TabsContent className="mt-2">
+ <TabsContent className="mt-6">
```

### 問題5: ダークモードが真っ黒

**原因**: bg-black を使っている

**修正方法**:
```diff
- <div className="dark:bg-black">
+ <div className="dark:bg-slate-950">

- <aside className="dark:bg-black">
+ <aside className="dark:bg-slate-900">
```

### 問題6: カードの中身が窮屈

**原因**: カード内のパディングが足りない

**修正方法**:
```diff
- <Card className="p-4">
+ <Card className="p-6">
```

### 問題7: Empty State がただのテキスト

**原因**: 適切なコンポーネント構造になっていない

**修正方法**:
```tsx
// Before
<p>データがありません</p>

// After
<div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
  <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4">
    <FileIcon className="h-8 w-8 text-slate-400" />
  </div>
  <div className="text-center">
    <p className="text-lg font-medium">データがありません</p>
    <p className="text-sm text-slate-500 mt-1">
      新しいデータを追加して始めましょう
    </p>
  </div>
  <Button>データを追加</Button>
</div>
```

### 問題8: サイドバーが狭すぎる

**原因**: 幅が足りない

**修正方法**:
```diff
- <aside className="w-48">
+ <aside className="w-64">
```

### 問題9: 複雑なコンポーネントの要素が整理されていない

**適用対象**: フィルター、ツールバー、プレイヤー、フォームなど

**原因**: 
1. 要素がグループ化されていない
2. 幅が統一されていない
3. 1行に詰め込みすぎている
4. 優先順位が反映されていない

**修正方法（6つの原則を適用）**:

```tsx
// Before: 要素が整理されていない
<div className="flex gap-2">
  <Input placeholder="min" />
  <Input placeholder="max" />
  <Select>...</Select>
  <Button>検索</Button>
  <Select>...</Select>
  <Input />
</div>

// After: 6つの原則を適用

// 原則1: グループ化（関連する要素をまとめる）
// 原則3: ゾーン配置（グループをゾーンとして配置）
// 原則5: 幅の統一（固定幅を設定）
<div className="flex items-center gap-6">
  {/* ゾーン1: 範囲フィルター */}
  <div className="flex items-center gap-2">
    <span className="text-sm text-slate-400 w-12">BPM</span>
    <Input className="w-20" placeholder="min" />
    <span className="text-slate-500">-</span>
    <Input className="w-20" placeholder="max" />
  </div>
  
  {/* ゾーン2: カテゴリフィルター */}
  <div className="flex items-center gap-2">
    <Select className="w-32">...</Select>
    <Select className="w-32">...</Select>
  </div>
  
  {/* ゾーン3: アクション */}
  <Button>検索</Button>
</div>
```

```tsx
// 要素が多い場合: 原則4（複数行）と原則2（優先順位）を適用

// Before: 1行に詰め込み
<div className="flex items-center h-12 px-4">
  <PlayButton />
  <ProgressBar />
  <TrackName />
  <Actions />
  <Settings />
  <Volume />
</div>

// After: 2行構成 + 優先順位で配置
<div className="h-24 px-6 py-4 border-t">
  {/* 1行目: 主要な操作（優先度高） */}
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <PlayButton />
      <span>0:16 / 2:59</span>
    </div>
    <ProgressBar className="flex-1 mx-6" />
    <div className="flex items-center gap-2">
      <Volume />
    </div>
  </div>
  
  {/* 2行目: 情報 + セカンダリ操作（優先度中〜低） */}
  <div className="flex items-center justify-between">
    <TrackName />
    <div className="flex items-center gap-4">
      <Actions />
      <SettingsDropdown /> {/* 使用頻度低いものは折りたたみ */}
    </div>
  </div>
</div>
```

**チェックポイント**:
- [ ] 原則1: 関連する要素がグループ化されているか？
- [ ] 原則2: 重要なものが目立つ位置にあるか？
- [ ] 原則3: ゾーンに分かれているか？
- [ ] 原則4: 1行に詰め込みすぎていないか？
- [ ] 原則5: 幅が統一されているか？
- [ ] 原則6: 十分な高さ・パディングがあるか？

---

## 確認の自動化（オプション）

### Playwright でデザインチェックを自動化

```typescript
// design-check.ts
import { chromium, Page } from 'playwright';

async function checkDesign() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);

  const issues: string[] = [];

  // サイドバーの幅をチェック
  const sidebar = await page.$('aside');
  if (sidebar) {
    const box = await sidebar.boundingBox();
    if (box && box.width < 256) {
      issues.push(`サイドバーが狭すぎます（${box.width}px < 256px）`);
    }
  }

  // ヘッダーの高さをチェック
  const header = await page.$('header');
  if (header) {
    const box = await header.boundingBox();
    if (box && box.height < 56) {
      issues.push(`ヘッダーが低すぎます（${box.height}px < 56px）`);
    }
  }

  // スクリーンショットを保存
  await page.screenshot({ path: 'design-check.png', fullPage: true });

  // 結果を出力
  if (issues.length > 0) {
    console.log('デザインの問題が見つかりました:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log('デザインチェック完了: 問題なし');
  }

  await browser.close();
}

checkDesign();
```

---

## このステップの成果物

- [ ] スクリーンショット（ライトモード）
- [ ] スクリーンショット（ダークモード）
- [ ] 確認チェックリストの結果
- [ ] 修正した箇所のリスト

---

## 注意事項

1. **「実装したら終わり」ではない**
   - 必ずスクリーンショットで確認する
   - 自分の目で見て「良い」と思えるまで修正する

2. **複数の画面サイズで確認する**
   - 最低でもデスクトップサイズ（1440px）で確認
   - 余裕があればタブレット、モバイルも

3. **ダークモードも忘れずに**
   - ライトモードで問題なくても、ダークモードで崩れていることがある

4. **第三者の目で見る**
   - 自分で作ったものは問題に気づきにくい
   - 可能であれば他の人にも見てもらう
