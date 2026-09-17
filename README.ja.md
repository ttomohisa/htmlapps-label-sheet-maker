# Label Sheet Maker / ラベルシート作成

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-label-sheet-maker/)

[English README](README.md)

ラベルシートの物理寸法を合わせ、文字・差し込みデータ・画像・QRコード・バーコードを配置し、使いかけ用紙を含むシート全体へ順番に並べるブラウザーツールです。

**v1.0.0は正式版です。** 用紙 → ラベル → シート → 出力の一連の流れに、差し込みデータ、画像・コード、使いかけ位置、印刷補正/PDF、作業ファイル、PC/スマホ向けのラベル編集操作まで揃えています。

![Label Sheet Maker / ラベルシート作成の画面](assets/screenshot.png)

## 主な機能

- A4 / Letter / カスタム用紙
- mm / inch表示切替（内部計算はmm）
- メーカー名に依存しない汎用レイアウトプリセット
- ラベル番号付きSVGライブプレビュー
- 右余白 / 下余白の自動計算
- 用紙からのはみ出し・不正値検出
- よく使う用紙設定を名前付きで端末内保存
- mm座標で管理するSVGラベルエディタ
- 要素枠全体のドラッグ移動 / 四隅リサイズ / 選択状態のカーソル変化
- キャンバス上部のアイコン操作（複製 / 前面 / 背面 / 削除）
- スマホで選択要素を操作できる下部固定アクションバーと長押しメニュー
- ゴシック / 明朝に加え、メイリオ・游ゴシック・游明朝・ヒラギノ系・丸ゴシック・等幅などのローカル書体
- 文字サイズ / 太字 / 横・縦揃え / 折り返し
- 50〜300%ズーム / パンモード / 安全余白 / スナップON/OFF / Undo / Redo
- キャンバス選択後のDelete / Backspace削除、矢印キー0.2mm移動、Shift+矢印1mm移動、Alt+ドラッグの一時スナップ無効、Escape選択解除
- ラベル画面上部とツール欄から入れる差し込みデータ導線
- UTF-8 / UTF-8 BOM / Shift_JIS のCSV・TSV読み込み
- Drag & Dropと表データ貼り付け
- 行プレビューとデータ列のラベル配置
- 同一ラベル繰り返し / データ差し込みモード
- PNG / JPEG / WebP画像（全体表示 / 枠いっぱい）
- 固定値または差し込み項目から生成するUTF-8 QRコード
- Code 128 Set B / Code 39のベクターバーコードと入力検証
- 実際の用紙寸法に沿ったシート全体プレビュー
- 使いかけ用紙の使用済み位置を手動指定
- 空いている位置だけへデータ順を保って自動配置
- 2ページ目以降を新品シートとして扱う複数ページ計算
- X/Y各±10mm、0.1mm単位の印刷位置補正
- 補正値を名前付きで端末内保存
- ラベル枠・中央マーク・番号入りの位置合わせ用PDF
- A4 / Letter / カスタム用紙の300dpi相当印刷用PDF生成
- 補正値を反映した最終ページプレビュー
- 画像や差し込みデータも含めた `.labelsheet.json` 作業ファイル保存 / 読み込み
- schemaVersionによる形式管理と、破損・未対応ファイルのエラー表示
- 日本語 / 英語UI
- PCの4ステップナビゲーション
- スマートフォンの下部固定4タブ
- 実行時CDN / API / analytics / telemetry / 外部フォントなし
- 通常の単一HTML版とgzip自己解凍版

**用紙 → ラベル → シート → 出力** の4工程に加え、v1.0.0ではv0.8の操作改善に加え、テキストのダブルクリック編集、モバイル編集ボタン、削除Undo、スナップガイドへ対応しています。

## 使い方

1. **用紙**を開きます。
2. 汎用プリセットを選ぶか、A4 / Letter / カスタム用紙を選択して寸法を入力します。
3. ラベル幅・高さ、行列、左/上余白、縦横間隔を設定します。
4. シートプレビューと自動計算された右/下余白を確認します。
5. **ラベル**を開き、テキスト等を追加します。要素枠をドラッグして移動、四隅でサイズ変更し、選択後は上部のアイコンから複製・前面・背面・削除できます。
6. CSV / TSV / 表データを使う場合は、ラベル画面の**差し込み**からデータ設定へ移動し、列をデータ項目として追加します。
7. 画像、QRコード、Code 128、Code 39を追加し、固定値またはデータ項目を設定します。
8. ズーム / パンと安全余白を使って配置を確認します。
9. **シート**を開き、1ページ目で既に使ったラベル位置をタップして使用済みにします。
10. 自動計算されたページを切り替え、2ページ目以降の配置も確認します。
11. **出力**を開き、必要なら位置合わせ用PDFを作ってX/Y補正値を調整します。
12. 印刷用PDFを作成・保存し、印刷時は**実際のサイズ / 100%**を使用します。
13. よく使う用紙寸法とプリンター補正値は端末内へ保存できます。
14. 上部の**作業ファイルを保存**から `.labelsheet.json` を保存し、**作業ファイルを開く**またはドラッグ＆ドロップで後から再開できます。

内蔵プリセットは物理寸法と行列だけを表す汎用設定で、メーカー公式テンプレートではありません。

## プライバシー

入力した用紙寸法、CSV / 表データ、ローカル画像、QR・バーコード内容、補正値、作業ファイルの保存・読み込み、PDF生成はブラウザー内で処理されます。このアプリから外部サーバーへ送信しません。

Content Security Policyは標準どおり `connect-src 'none'` を維持しています。v1.0.0も実行時のCDN・外部ライブラリ取得・外部フォント依存はなく、追加書体も端末内フォントのフォールバックです。

保存したカスタムレイアウトはブラウザーのサイトデータに保存されます。サイトデータを削除すると消える場合があります。

## 現在の範囲

v1.0.0では一連の印刷フローと作業ファイルに加え、ダブルクリック編集、削除Undo、スナップON/OFF、Altでの一時スナップ無効、スマホ下部固定アクション、長押しメニューまで含むラベルキャンバス操作を仕上げています。

1. 用紙寸法
2. ラベル編集
3. CSV / 表貼り付けによる差し込み
4. 使いかけラベルの位置指定
5. プリンターX/Y位置補正
6. 印刷用PDF出力
7. 作業ファイル保存 / 再開

正式な対象範囲・対象外機能は [APP_SPEC.md](APP_SPEC.md) を参照してください。

## 対応ブラウザー

主な対象:

- Google Chrome
- Microsoft Edge
- Android Chrome

通常版HTMLは `file://` で直接開き、ネットワーク接続なしでも動作する構成です。

## 開発

Browser Kittyの最新単一HTMLテンプレート構成に準拠しています。

- 編集対象は `src/index.template.html`
- `dist/` の生成HTMLは直接編集しない
- アプリ情報は `app.config.json`
- 仕様・受入条件は `APP_SPEC.md`
- v1.0.0でも実行時CDN・パッケージ取得・外部フォント取得なし。QR、シート配置、作業ファイル処理、300dpi相当描画、PDF生成ロジックは単一HTMLへ内包

### テスト

```bash
node tests/v0.1-core.test.mjs
node tests/v0.1-static.test.mjs
node tests/v0.2-editor-core.test.mjs
node tests/v0.2-static.test.mjs
node tests/v0.3-data-core.test.mjs
node tests/v0.3-static.test.mjs
node tests/v0.4-media-core.test.mjs
node tests/v0.4-static.test.mjs
node tests/v0.5-sheet-core.test.mjs
node tests/v0.5-static.test.mjs
node tests/v0.6-output-core.test.mjs
node tests/v0.6-static.test.mjs
node tests/v0.7-project-core.test.mjs
node tests/v0.7-static.test.mjs
node tests/v0.8-editor-ux.test.mjs
node tests/v0.8.2-mobile-ux.test.mjs
node tests/v0.9-release-candidate.test.mjs
node tests/v1.0-mobile-ux.test.mjs
node tests/v1.0-longpress-release.test.mjs
node tests/v1.0-release.test.mjs
```

### Windowsでビルド

```bat
build-standalone.bat
```

生成物:

```text
dist/
├─ index.html
├─ index.self-extract.html
├─ dependency-manifest.json
├─ build-size-report.json
├─ self-extract-manifest.json
└─ .nojekyll
```

## 商標について

QRコードは株式会社デンソーウェーブの登録商標です。

## ライセンス

MIT License。詳細は [LICENSE](LICENSE) を参照してください。第三者由来部分の表示は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) に記載しています。
