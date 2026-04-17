# Step 5: ビジュアルデザイン

## このステップのゴール

「ダサい」を解消し、洗練された見た目に仕上げる。

## デザインの質を決める2つのレイヤー

| レイヤー | 内容 | 効果 |
|---------|------|------|
| スタイル基盤 | 色・余白・文字のルール | 「ダサい」の根本原因を解消 |
| 仕上げ | 角丸・影・整列などの細部 | 「プロっぽく」見せる |

---

## スタイル基盤

### 色のルール（3原則）

#### 原則1: 色数を絞る（3色まで）

```
✅ 推奨パレット
- ベース: slate-50 〜 slate-950（グレー系）
- アクセント: blue-600（または primary）1色のみ
- 背景: slate-50（ライト）/ slate-950（ダーク）
```

#### 原則2: 彩度を下げる

```
❌ 原色そのまま: #FF0000, #0000FF
✅ 彩度を落とす: #EF4444, #3B82F6（Tailwind の色）
```

#### 原則3: 背景は真っ白・真っ黒を避ける

```
【ライトモード】
❌ 真っ白: #FFFFFF, bg-white
✅ 少しグレー: #F8FAFC（slate-50）, #F9FAFB（gray-50）

【ダークモード】
❌ 真っ黒: #000000, bg-black
✅ 少し明るい黒: #020617（slate-950）, #09090b（zinc-950）
```

### ダークモードのルール

**ダークモードは「真っ黒」ではなく「濃いグレー」を使う。**

```
【ダークモードの色設計】

背景の階層（奥から手前へ）:
  Level 0（ページ背景）: bg-slate-950 (#020617)
  Level 1（サイドバー）: bg-slate-900 (#0f172a)
  Level 2（カード）:     bg-slate-800 (#1e293b)
  Level 3（ホバー）:     bg-slate-700 (#334155)

テキスト:
  主要テキスト:   text-slate-50 または text-white
  補助テキスト:   text-slate-400
  さらに薄い:     text-slate-500

ボーダー:
  通常:           border-slate-800
  強調:           border-slate-700

【禁止事項】
❌ bg-black（真っ黒）を使う
❌ 背景とテキストのコントラストが低すぎる
❌ すべてのエリアを同じ背景色にする
```

### 境界と視覚的階層のルール

**異なるエリアは視覚的に区別する。境界がないと「のっぺり」したUIになる。**

```
【必須の境界線】

ヘッダー:
  - 下に境界線: border-b border-slate-200 dark:border-slate-800
  - または影: shadow-sm

サイドバー:
  - 右に境界線: border-r border-slate-200 dark:border-slate-800
  - 背景色をコンテンツと変える

カード:
  - 境界線 + 角丸 + 影: border rounded-lg shadow-sm
  - または背景色の差: bg-white on bg-slate-50

【サイドバーの内部構造】

セクション見出し:
  - text-xs text-slate-500 dark:text-slate-400
  - uppercase tracking-wider
  - mb-2 mt-6（最初のセクション以外）
  - 例: 「素材」「動画」「設定」

メニュー項目:
  - py-2 px-3 rounded-md
  - gap-2（アイコンとテキストの間）
  - ホバー: bg-slate-100 dark:bg-slate-800
  - 選択中: bg-slate-100 dark:bg-slate-800 + font-medium

セクション間:
  - mt-6 以上の余白
```

### 余白のルール（3原則）

**重要: 余白は「多すぎるかな？」と思うくらいで丁度良い。窮屈なUIは素人っぽく見える。**

#### 原則1: 余白は「多め」が正解

迷ったら**必ず多めに取る**。余白が多すぎて困ることはほぼない。

#### 原則2: 余白のサイズを統一する（4の倍数）

```
【推奨する余白サイズと用途】

小さい余白（要素内の微調整）:
  4px  (p-1, gap-1) → アイコンとテキストの間、メニュー項目間
  8px  (p-2, gap-2) → バッジ内、ボタン内の左右パディング

中程度の余白（基本の余白）:
  12px (p-3) → ほとんど使わない（p-4を使う）
  16px (p-4, gap-4) → 小さいカード内、統計項目間

大きい余白（推奨デフォルト）:
  24px (p-6, gap-6, mt-6) → ★ 標準の余白 ★
  32px (p-8, gap-8) → セクション間

特大の余白（セクション間）:
  48px (p-12, gap-12) → 大きなセクション間
  64px (p-16, gap-16) → ページのヘッダー下、フッター上
```

#### 原則3: 具体的な推奨値（これに従うこと）

```
【ヘッダー】
- 高さ: h-14 (56px) または h-16 (64px)
- 内側パディング: px-6 py-4
- 下に境界線: border-b

【サイドバー】
- 幅: w-64 (256px) 以上 ← w-48 以下は窮屈で禁止
- 内側パディング: p-4 (16px) 以上
- メニュー項目: py-2 px-3
- メニュー項目間: space-y-1 (4px)
- セクション間: mt-6 (24px) 以上
- セクション見出し下: mb-2 (8px)

【タブ】
- タブ自体: px-4 py-2
- タブ間: gap-1
- タブリストとコンテンツの間: mt-6 (24px) 以上 ← mt-2, mt-4 は禁止

【統計・サマリー表示】
- 統計項目間: gap-4 (16px) 以上
- 統計エリアとメインコンテンツの間: mb-6 (24px) 以上

【カード】
- カード内パディング: p-6 (24px) を標準 ← p-4 は禁止
- カード間の余白: gap-6 (24px) 以上

【フォーム】
- フォーム全体のパディング: p-6 または p-8
- ラベルと入力欄の間: gap-2 (8px)
- フォーム項目間: gap-6 (24px) ← gap-4 は禁止
- セクション間: gap-8 (32px) 以上

【ページ全体】
- ページの左右パディング: px-6 または px-8
- ページの上下パディング: py-6 以上
- メインコンテンツとサイドバーの間: gap-8 (32px)

【テーブル】
- セルのパディング: px-4 py-3 または px-6 py-4
- ヘッダーセル: px-4 py-3 以上

【ボタン】
- 通常ボタン: px-4 py-2（shadcn/ui のデフォルト）
- 大きいボタン: px-6 py-3 または px-8 py-4
```

#### 禁止事項

```
❌ p-2, p-3, p-4 をカードの主要パディングに使う
❌ gap-2, gap-4 をフォーム項目間・セクション間に使う
❌ mt-2, mt-4 をタブとコンテンツの間に使う
❌ w-48 以下のサイドバー幅
❌ 余白を省略して要素を詰め込む
```

### 文字のルール（3原則）

#### 原則1: フォントサイズは3種類まで

```
見出し: text-lg (18px) または text-xl (20px)
本文:   text-sm (14px) または text-base (16px)
補助:   text-xs (12px)
```

#### 原則2: 太さは2種類まで

```
普通:   font-normal (400)
強調:   font-medium (500) または font-semibold (600)
```

#### 原則3: 文字色も3種類まで

```
主要:   text-slate-900（濃いグレー）
補助:   text-slate-500（中間グレー）
強調:   text-blue-600（アクセントカラー）
```

---

## 仕上げのテクニック

### 角丸を統一する

```
❌ バラバラ: rounded-sm, rounded-lg, rounded-full が混在
✅ 統一: rounded-md (6px) または rounded-lg (8px) に統一
```

### 影は控えめに

```
❌ 強すぎる: shadow-lg, shadow-xl, shadow-2xl
✅ 控えめ: shadow-sm（基本）、shadow-md（強調時のみ）
```

### ボーダーは薄く

```
❌ 強すぎる: border-black, border-2
✅ 薄く: border border-slate-200 dark:border-slate-700
```

### 要素の整列を揃える

```
❌ 左端がバラバラ
✅ 左端を揃える（または中央揃え）
```

### アイコンを効果的に使う

- 重要なボタンにはアイコンをつける
- ナビゲーションにはアイコンを添える
- 使用ライブラリ: lucide-react

### タブのスタイル

**タブは選択状態が明確に分かるようにする。**

```
【推奨スタイル（shadcn/ui の Tabs を使用）】

タブリスト:
  - bg-slate-100 dark:bg-slate-800 rounded-lg p-1

タブトリガー:
  - px-4 py-2 rounded-md
  - 非選択: text-slate-600 dark:text-slate-400
  - 選択中: bg-white dark:bg-slate-900 shadow-sm font-medium

【禁止事項】
❌ 選択状態と非選択状態の違いが分かりにくい
❌ タブ間の余白がない
❌ タブがクリックできることが分からない
```

### サイドバーの構造

**サイドバーは「セクション」で区切り、階層を明確にする。**

```
【サイドバーの構造】

<aside class="w-64 border-r bg-slate-50 dark:bg-slate-900 p-4">
  <!-- セクション1 -->
  <div>
    <h3 class="text-xs text-slate-500 uppercase tracking-wider mb-2">素材</h3>
    <nav class="space-y-1">
      <a class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100">
        <Icon class="h-4 w-4" />
        <span>楽曲</span>
      </a>
      ...
    </nav>
  </div>
  
  <!-- セクション2（mt-6 で区切る） -->
  <div class="mt-6">
    <h3 class="text-xs text-slate-500 uppercase tracking-wider mb-2">設定</h3>
    <nav class="space-y-1">
      ...
    </nav>
  </div>
</aside>

【ポイント】
- セクション見出し: text-xs uppercase tracking-wider text-slate-500
- セクション間: mt-6（24px）以上の余白
- メニュー項目: py-2 px-3 rounded-md
- アイコン: h-4 w-4、テキストとの間に gap-2
```

### Empty State（空の状態）

**データがない画面は「空っぽ感」を解消し、次のアクションを示す。**

```
【Empty State の必須要素】

1. アイコン（大きめ、薄いグレー）
2. メインメッセージ（何がないのか）
3. サブメッセージ（どうすればいいか）
4. アクションボタン（可能であれば）

【コード例】
<div class="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
  <div class="rounded-full bg-slate-100 dark:bg-slate-800 p-4">
    <Music class="h-8 w-8 text-slate-400" />
  </div>
  <div>
    <p class="text-lg font-medium text-slate-900 dark:text-slate-50">
      選別する楽曲がありません
    </p>
    <p class="text-sm text-slate-500 mt-1">
      楽曲をアップロードして選別を始めましょう
    </p>
  </div>
  <Button class="mt-2">
    <Upload class="h-4 w-4 mr-2" />
    楽曲をアップロード
  </Button>
</div>

【禁止事項】
❌ ただのテキストだけ（「データがありません」）
❌ 中央寄せされていない
❌ 次に何をすべきか分からない
```

---

## 技術スタック

- UIコンポーネント: **shadcn/ui**
- スタイリング: **Tailwind CSS**
- アイコン: **lucide-react**

### shadcn/ui の導入

```bash
npx shadcn@latest init
npx shadcn@latest add button card table input select dialog tabs
```

### shadcn/ui を使うメリット

- プロがデザインした「部品」を組み合わせるだけ
- Claude Code がよく理解している
- 一貫性のあるデザインが自動的に保たれる

---

## CLAUDE.md に追加するルール

```markdown
## デザインルール

### 余白（最重要：余白は多めに取ること）

■ ヘッダー
- 高さ: h-14 または h-16
- パディング: px-6 py-4
- 下に境界線: border-b

■ サイドバー
- 幅: w-64 以上（w-48 以下は禁止）
- パディング: p-4 以上
- メニュー項目: py-2 px-3
- セクション間: mt-6 以上

■ タブ
- タブとコンテンツの間: mt-6 以上（mt-2, mt-4 は禁止）

■ 統計・サマリー表示
- 項目間: gap-4 以上
- コンテンツとの間: mb-6 以上

■ カード
- パディング: p-6 以上（p-4 は禁止）
- カード間: gap-6 以上

■ フォーム
- 項目間: gap-6 以上（gap-4 は禁止）
- セクション間: gap-8 以上

### 余白の禁止事項
- p-2, p-3, p-4 をカードに使わない
- gap-2, gap-4 をフォーム項目間に使わない
- mt-2, mt-4 をタブとコンテンツの間に使わない
- w-48 以下のサイドバー幅

### 背景色と階層
【ライトモード】
- ページ背景: bg-slate-50（bg-white 禁止）
- サイドバー: bg-white または bg-slate-100
- カード: bg-white + border + shadow-sm

【ダークモード】
- ページ背景: bg-slate-950（bg-black 禁止）
- サイドバー: bg-slate-900
- カード: bg-slate-800 + border-slate-700

### 境界線（必須）
- ヘッダー下: border-b border-slate-200 dark:border-slate-800
- サイドバー右: border-r border-slate-200 dark:border-slate-800
- カード: border rounded-lg shadow-sm

### サイドバー
- セクション見出し: text-xs text-slate-500 uppercase tracking-wider mb-2
- セクション間: mt-6 以上
- メニュー項目: py-2 px-3 rounded-md、アイコンとテキストは gap-2

### Empty State（データがない時）
- 中央寄せ: flex flex-col items-center justify-center min-h-[400px]
- 必須要素: アイコン + メッセージ + サブメッセージ + アクションボタン
- ただのテキストだけは禁止

### タブ
- shadcn/ui の Tabs を使用
- 選択状態を明確に区別する

### 文字
- サイズ: 3種類まで（text-xs, text-sm, text-lg）
- 太さ: 2種類まで（font-normal, font-medium）
- 色: text-slate-900/50/500（ライト）、text-slate-50/400/500（ダーク）

### 統一感
- 角丸: rounded-lg で統一
- 影: shadow-sm のみ
- ボーダー: border-slate-200 dark:border-slate-700

### 禁止事項
- グラデーション
- 真っ白(#FFF)/真っ黒(#000)の背景
- 境界線なしでエリアを区切る
- Empty State をただのテキストにする
```

---

## チェックリスト

### 背景色と階層
- [ ] ページ背景は真っ白(#FFF)・真っ黒(#000)を避けているか？
- [ ] サイドバーとコンテンツの背景色は区別されているか？
- [ ] ダークモードで bg-slate-950/900/800 の階層があるか？

### 境界線
- [ ] ヘッダー下に border-b があるか？
- [ ] サイドバー右に border-r があるか？
- [ ] カードに border + rounded-lg + shadow-sm があるか？

### ヘッダー
- [ ] 高さは h-14 または h-16 か？
- [ ] パディングは px-6 py-4 以上か？

### サイドバー
- [ ] 幅は w-64 (256px) 以上か？（w-48 以下は禁止）
- [ ] 内側パディングは p-4 以上か？
- [ ] セクション見出しがあるか？（text-xs uppercase tracking-wider）
- [ ] セクション間に mt-6 以上の余白があるか？
- [ ] メニュー項目に py-2 px-3 のパディングがあるか？
- [ ] メニュー項目にホバースタイルがあるか？
- [ ] 選択中の項目が分かるか？

### タブ
- [ ] 選択状態と非選択状態が明確に区別できるか？
- [ ] タブとコンテンツの間に mt-6 以上の余白があるか？（mt-2, mt-4 は禁止）

### 統計・サマリー表示
- [ ] 統計項目間に gap-4 以上の余白があるか？
- [ ] 統計とメインコンテンツの間に mb-6 以上の余白があるか？

### カード・フォームの余白
- [ ] カード内パディングは p-6 (24px) 以上か？（p-4 は禁止）
- [ ] フォーム項目間は gap-6 (24px) 以上か？（gap-4 は禁止）
- [ ] セクション間は gap-8 (32px) 以上か？
- [ ] 余白が窮屈に見えないか？（迷ったら増やす）

### Empty State
- [ ] データがない時、ただのテキストだけになっていないか？
- [ ] アイコン + メッセージ + サブメッセージ があるか？
- [ ] 中央寄せされているか？
- [ ] 次のアクションが分かるか？

### 文字
- [ ] フォントサイズは3種類以内か？
- [ ] 太さは2種類以内か？

### 統一感
- [ ] 角丸は rounded-lg で統一されているか？
- [ ] 影は shadow-sm のみか？
- [ ] ボーダーは border-slate-200 (dark: border-slate-700) か？

---

## まとめ

「ダサい」の多くは以下が原因：
1. **色が多すぎる / 彩度が高すぎる** → 3色に絞る、彩度を下げる
2. **余白がバラバラ / 足りない** → 4の倍数で統一、多めに取る
3. **細部が統一されていない** → 角丸・影・ボーダーを統一

これらのルールを守り、shadcn/ui を使えば、自然と洗練されたUIになる。
