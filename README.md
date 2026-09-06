# 電気設備の計算ツール集（denki-tools）

電気工事・計装工事向けの無料Web計算ツール集。GitHub Pagesで公開する構成になっています。

- `/` … トップページ（ツール一覧・静的HTML）
- `/rack-checker/` … ケーブルラック占有率・荷重チェッカー（React）
- PWA対応（ホーム画面追加でオフライン動作）

## 公開手順（初回のみ・約10分）※URL類はRed-Spider-Lily-616で設定済み

1. **GitHubで新規リポジトリ作成**
   リポジトリ名: `denki-tools`（Public）
   ※別名にする場合は `vite.config.js` の `base: '/denki-tools/'` を合わせて変更

2. **push**
   ```bash
   git init
   git add .
   git commit -m "initial release"
   git branch -M main
   git remote add origin https://github.com/Red-Spider-Lily-616/denki-tools.git
   git push -u origin main
   ```

3. **GitHub Pagesを有効化**
   リポジトリの Settings → Pages → Build and deployment → Source を **GitHub Actions** に設定。
   （pushすると `.github/workflows/deploy.yml` が自動でビルド＆デプロイします）

4. **公開URL**
   `https://red-spider-lily-616.github.io/denki-tools/`
   Actionsタブでデプロイ完了（緑チェック）を確認してからアクセス。

## 公開後にやると良いこと

- **Google Search Console** にサイトを登録（URLプレフィックスで上記URLを指定）
- OGP画像の表示確認（X/LINE等でURLを貼ってカード表示をチェック）
- トップページのフッターにプロフィール・監修依頼の導線リンクを追加

## ツールを追加する方法（同ジャンル）

1. `new-tool/index.html` を作成（`rack-checker/index.html` をコピーしてメタ情報を変更）
2. `src/` にコンポーネントとエントリ（`main-newtool.jsx` 等）を追加
3. `vite.config.js` の `build.rollupOptions.input` に追記:
   ```js
   input: {
     top: r("index.html"),
     rack: r("rack-checker/index.html"),
     newtool: r("new-tool/index.html"),
   }
   ```
4. トップページ `index.html` のツール一覧にカードを追加

## 別ジャンルを公開する場合（検索流入を混ぜない）

`github.io` はPublic Suffix List登録済みのため、`aaa.github.io` と `bbb.github.io` は
検索エンジン上「別サイト」として扱われます。

- **電気系ツール** → このリポジトリにページを追加していく（専門性が1サイトに蓄積）
- **別ジャンル** → 新しいOrganizationを作成し、そのOrg配下の新リポジトリで公開
  （例: Org `xxx-tools` → `xxx-tools.github.io/リポジトリ名/`）
- 本格運用するジャンルは独自ドメイン化も検討（Settings → Pages → Custom domain）

## 開発コマンド

```bash
npm install     # 初回のみ
npm run dev     # 開発サーバー（http://localhost:5173/denki-tools/）
npm run build   # 本番ビルド（dist/）
npm run preview # ビルド結果の確認
```

## データの編集箇所（src/App.jsx 上部）

- `DB` … ケーブルの型式・外径・質量（概算値。社内標準値に書き換え可）
- `RACK_WIDTHS` … ラック標準幅のラインナップ
- `SERIES` … 許容静荷重表（ネグロス技術資料ベースの参考値。カタログ正式値に差し替え推奨）
- `TEMPLATES` … テンプレパターン
- `judge()` … 判定しきい値（50/70/90/100%）

## 免責

計算結果は概算値による参考情報です。実施設計ではメーカーカタログ・内線規程・社内基準にて確認してください。
