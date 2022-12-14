# Kanper

![kanper-demo](https://user-images.githubusercontent.com/41366495/194407259-08027246-0de6-4101-98c6-4af273220a10.gif)

## Table of Contents

**for general**
- About
- 導入方法
- 機能一覧

**for developers**
- リポジトリの構成
- 構成技術
- 開発ロードマップ
- License

**for MWSCup**
- 審査基準について

## About

短縮URLを検知し，確認ページで移動先の情報を表示することでユーザを危険なページから保護するブラウザ拡張機能です．

短縮URLとは，Bitlyなどの短縮URLプロバイダから提供される，正規のURLにリダイレクトされる短めなURLのことです．
長いURLを短くでき便利な反面，悪質サイトへのURLが隠されてしまうためフィッシングなどに悪用されるという問題点があります．
このツールは，短縮URLにアクセスしたときに遷移先ページの情報を表示することで，危険なページへのアクセスを防止することを目的とします．

> このツールは`MWSCup 2022 事前課題`として`Undanomi`が作成しました．

## できること

この拡張機能を用いることで以下のことが可能になります．

1. 短縮URLを展開し，どこへリンクされているのか知ることができる．
2. ブラックリスト・ホワイトリストを活用しUXを損なわずに安全性を確保できる．
3. プライバシーなどに配慮し，上記に関係する処理を所有端末内で完結することができる．

## 導入方法

1. このリポジトリの[Release](https://github.com/alpherg0221/ShortUrlExt/releases)をクリック
2. 一番上の最新バージョンのrelease.zipをダウンロードして解凍
3. Chrome「設定」→「拡張機能」をクリックし，拡張機能編集ページを開く
4. 右上のディベロッパーモードをオンにし，「パッケージ化されていない拡張機能を読み込む」をクリック
5. 解凍したファイル(frontend)を選択

この拡張機能のコアである短縮URLの展開機能について，Chrome拡張機能を導入せずに内容を確認できるように[デモページ](https://alpherg0221.github.io/ShortUrlExt/)を用意しています．ただし，拡張機能がないと自動的な割り込み対応などはできません．

## 機能一覧

### 遷移確認ページ

短縮URLにアクセスしたとき，最初に表示されるページです．  
以下のものが表示されています．

- 遷移先URL
- ページタイトル
- ページの説明
- ページのサムネイル
  - サムネイルをクリックすることで解像度が上がります
- 安全性チェック
  - 遷移先のページが安全かどうかを外部サイトで確認することができます

遷移確認ページでは，以下の事ができます．

- 遷移先ページに移動
- 遷移先ページをホワイトリストに登録
- 遷移先ページをブラックリストに登録

> これらの情報はシステム側で取得するので，拡張機能をインストールしたPCでは短縮URLに関するサーバに一切のHTTPパケットが飛びません．これはWiresharkにて検証済みです．

### ホワイトリスト機能

安全と判明しているページをホワイトリストに登録することで，遷移確認ページを省略することができます．拡張機能ポップアップからホワイトリストを編集できます．

短縮URLの遷移先のドメインがホワイトリストに登録されていれば，確認ページを表示せずに短縮URLのページにアクセスします．

### ブラックリスト機能

危険と判明しているページをブラックリストに登録することで，そのページにアクセスできないようにします．拡張機能ポップアップからブラックリストを編集できます．

短縮URLの遷移先のドメインがブラックリストに登録されていれば，確認ページにてダイアログを表示後，タブを閉じます．

### サーバの変更機能

拡張機能がアクセスするAPIサーバは自由に変えることができます．

**背景**

> この拡張機能は常にWebページの遷移を監視しながらサーバに自動的にアクセス情報などを送信しています．
>
> この挙動に対してプライバシーなどの懸念が存在することは当然であり，このようなツールを利用すると思われるターゲット層で特に顕著だと考えています．しかしながらこの動作自体は今回のような機能を実現する上で必要不可欠であり，これ自体を避けることができないため，別のアプローチによる問題の解決を実装しました．
>
> 今回用意したのはセルフホスティングするサーバなどを用いることで，アクセス情報などを所有端末内で完結できるようにしました．具体的にはDockerやGolangによる可搬性を確保したバックエンドを自前のサーバに展開，同様にワーカーを起動しておくことにより，アクセス情報を処理するシステムを完全に制御することが可能になります．詳細については[バックエンドのREADME](https://github.com/alpherg0221/ShortUrlExt/tree/main/backend)を参照下さい．

### 拡張機能ポップアップ

右上の拡張機能アイコンをクリックするとポップアップが表示されます．ここでは各種設定を行ったり，使い方を見ることができます．

- ホワイトリストを編集
  - ホワイトリスト編集ページを開きます
- ブラックリストを編集
  - ブラックリスト編集ページを開きます
- このページをホワイトリストに追加
  - 現在表示しているページをホワイトリストに追加します
- サーバを変更
  - 遷移先ページの情報取得を行うサーバを変更することができます

---

*for developers*

## リポジトリの構成

```
/
|--- .github/workflows/
|       自動リリースのGithub Actionsの設定ファイル
|--- backend/
|       遷移先ページの情報取得を行うAPI(Golang)
|--- docs/
|       機能を試すためのページのコンテンツ(Github Pages)
|--- driver/
|       情報取得のためにChromeを動作させるドライバ(Golang)
|--- frontend/
|       Chromeの拡張機能(HTML/CSS/JS)
|--- proto/
        Protocol Buffer
```

## 構成技術

### 全体構成

![](https://user-images.githubusercontent.com/41366495/194413609-cdcba445-769c-437d-8743-5e4fa847c4cd.png)

### Backend

#### Server

- Golang製
  - 初期実装はPythonだった
  - Pythonの速度面，パラダイム面の問題に直面し全ての実装を移行
- 動作はGCPのインスタンス x 2を使用
  - APIサーバとワーカーインスタンス
- APIのドキュメント化（[Swagger](https://mws2022.pfpfdev.net/docs/)）
  - 最初期から行い，フロントエンド側との連携を促進した
- セキュリティに関する懸念の解決
  - Dockerで可搬性を確保
    - セルフホスティングも可能な設計
  - HTTPSによるAPIの提供
    - ドメインを指定するだけでLet's EncryptからのSSLを自動でとってくる
    - WebSocketなども含めて総合的に暗号化

#### Worker

- 高速なURL解決
  - 全体では複雑な構造で速度がかなり低下する
  - 並行処理，アクセス最適化による速度向上を実現
- 冗長化を前提としたスケール可能な設計
  - ワーカーとなるプログラムはインターネット接続さえあれば動作
- リアルタイム通信
  - 最初期はマネージドなFirestoreによる簡単な通信
  - 配布のためにWebSocketによる通信に切り替えた
  - protocol buffersによる言語を問わない通信
- 汚染を前提としたURLへのアクセス構成
  - VM上で簡単にロールバックができるように

### Frontend

- HTML/CSS/JSでブラウザ拡張機能の実装
  - ブラウザ拡張機能とすることで誰でも使いやすい
  - HTML/CSS/JSで書くことで，機能追加や変更が容易に
- 拡張機能でのManifest v3の採用
  - 今後のManifest v2の廃止に対応
- 機能ごとにモジュール化
  - 開発時の可読性の向上
  - メンテナンス，バグの修正が容易になる
- Material Designを使用
  - 見やすいデザイン，直感的な操作を実現
- Bootstrapによるレスポンシブ対応
  - 様々な画面サイズでも表示が崩れずUXが向上
- Google Safe Browsing APIの使用
  - APIを用いることで，煩雑なスクレイピングをせずに情報の取得が可能

## 開発ロードマップ

- [完了]phase1 初期実装
  - リダイレクト検知・ブロックに関するロジックの実装
  - 遷移確認ページの表示

- [完了]phase2 システム化
  - サーバの実装
    - 遷移先に関する詳細な情報の取得
      - タイトル
      - サムネイル
    - 拡張機能側からの余計なリクエストを削除
    - 複数段のリダイレクトのハンドリング
    - SwaggerによるAPIのドキュメント化
  - ホワイトリストの追加 
    - 編集機能
    - 確認なしに自動遷移する機能

- [完了]phase3 UXの改善
  - サーバの改善
    - 遷移先に関する情報の取得
      - Description
    - 読み込み時間の短縮
      - リアルタイムDB(Firestore)からWebSocketへの移行
      - 処理の平行化
      - HTTPクライアントの活用
    - セキュアモードの実装
      - セルフホスティングに向けた実装
  - ホワイトリスト機能の追加
    - 今のページをホワイトリストに追加する
  - ブラックリストの追加
    - 編集機能
    - ページを自動で閉じる機能
  - 安全性チェック(Google Safe Browsing，Norton Safe Web，Kaspersky Threat Intelligence Portal)

- phase4 機能追加・改善
  - 複数端末でのホワイトリスト・ブラックリストの同期機能の追加
  - 対応する短縮URLの追加
  - より簡単なプライバシー担保
    - サーバは既存のものを使いながらワーカーのみでこれを実現
      - アカウント・トークン管理
      - エンド2エンドの暗号化
      - コストが高いので収益化も含めた検討
  - マルチな環境でのワーカーの動作
    - 自作HTTPクライアントの実装
  - 開発環境の改善
    - CI/CDによるサーバ環境の効率化
    - How to contributeのドキュメント整備

## Licence

This software is released under the MIT License, see LICENSE.

---

*for MWSCup*

## 審査基準について

### 要件

- Github上で公開し，容易に利用・改変可能となっている
- チームで協力して作成している
- 成果物による法令順守違反及び倫理問題はない

### 新規性

- UXを損なわないホワイトリスト・ブラックリスト機能
- アクセス情報などを完全に制御できるセキュア機能

### 実用性

- 短縮URLは現在もフィッシングメール等で頻繁に用いられており，展開先URLがブロックリストに入っていない場合でも，ユーザが遷移先の情報を確認してアクセスを防ぐことができる．
  - 実際のフィッシングサイトを用いて行ったテストでも問題なく動作し，危険を検知した
- 本ツールは拡張機能として実装しているため，手軽に使うことができる
- 短縮URLはさまざまな場面で用いられているため，本ツールを活用できる場面は多い
- 短縮URLにアクセスしたときに確認ページを表示するというコンセプトの他に，ホワイトリスト・ブラックリスト機能などの機能を搭載
- 使いやすいデザインとなっており，使用方法も単純である

### 継続性

- Github Releasesを用いてCDパイプラインを作成
- READMEにて利用方法，改良方法を提示
- README内のロードマップにて開発のこれまでと今後を可視化

### チームワーク

コーディングに関しては適切に分担し，ペアプログラミングなどの手法も取り入れながら作業を進めた．
コーディングタスクが存在しないメンバーもツールの開発・発表に必要なタスクを適切に分担した．具体的なタスクの分担はプライバシーの関係でここでは省略する．
