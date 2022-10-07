# Backend

ここではどのようにしてプライバシーに配慮＆信用できる結果を得ることができるかを説明します．
なお，これの実現としてはサーバー運用が前提となります．

## 実現できること

このページにある作業を行うことで下記が実現できます．

+ 拡張機能から送信されるすべてのデータを受けとる
+ 自分で用意したワーカーから送信されたデータを表示する

これらにより，この拡張機能から送信される情報は今回設定するサーバー，ワーカー以外には渡らず，アクセス情報といった機微な情報を安全に処理できることに加え，確認画面に出てくる情報も自身のワーカーによる信頼できるデータとなります．

## 具体的な作業

下記作業は`WSL2`の上で動作確認をしました．

### サーバーの設定

下記コマンドを実行することでサービスが起動します．注意書きを読んでから実行してください．

1. Githubからリポジトリをクローンします
   1. `git clone https://github.com/alpherg0221/ShortUrlExt`
2. リポジトリのbackendディレクトリに移動します
   1. `cd ShortUrlExt/backend`
3. 環境にGo言語/Dockerが入っていることを確認した上でビルドを行います
   1. `go mod tidy`：goの依存関係の解決
   2. `go build`：goのコンパイル
   3. `docker build -t shorturlext .`：docker imageの作成
4. Dockerのイメージを起動します
   1. `docker run -p 80:8080 -p 443:443 -e TLS_DOMAIN="example.com" -e SERVER_SECRET="SERVER_SECRET" shorturlext`：

> **注意**
> - Dockerを用いてGo言語をコンパイルする場合はDockerfileの先頭の方をアンコメントし，マルチステージビルドを行います
>   - 実行ファイルをコピーするコマンドも適切にアンコメントする必要があります
> - Dockerのイメージを起動するには引数の`TLS_DOMAIN`と`SERVER_SECRET`を変更する必要があります
>   - ドメインの設定を省略するとTLSを利用しないHTTP/WSで動作しますが，拡張機能自体はHTTPSで接続を行うので動作に失敗します
>   - サーバーは起動すると自動的にLet's Encryptを利用した証明書の取得を行います
>   - 証明書の取得の際にドメインでサーバーのグローバルIPを解決できることが必要です
> - SERVER_SECRETは不特定多数のワーカーが接続しないようにするものです
>   - 漏洩しないように気をつける必要があります

この作業が完了すると，SwaggerによるAPIアクセスが可能になります．`/docs/`にアクセスすることでSwaggerを見ることができます．
ただしワーカーを繋がないとAPIは正しく動作しません．

## ワーカーの設定

下記コマンドを実行することでサービスが起動します．サーバーの際と同様に注意書きを読んでから実行してください．

1. リポジトリのdriverディレクトリに移動します．
2. 環境にGo言語が入っていることを確認した上でビルドを行います．
   1. `go mod tidy`：goの依存関係の解決
   2. `go build`：goのコンパイル
3. driverが正しく動作することを確認します．

```
 ./driver -h                        
Usage of ./driver:
  -headless
    	chrome visibility (default true)
  -height int
    	height of thumbnail (default 1080)
  -width int
    	width of thumbnail (default 1920)
  -ws string
    	Websocket endpoint URL
```

WebSocketは`https://server.of.above/ws/SERVER_SECRET`

あとは運用面に応じて適切にコマンドライン引数を設定し，実際に動作させます．

> **注意**
> - driverは外部ブラウザに依存します
> - 現時点では下記HTTPのクライアントが必要です
>     - wget
>     - google-chrome
> - headlessをfalseにすると，chromeが目に見える形で起動します
> - heightとwidthは正方形になるように値を設定することをおすすめします

この作業が完了し，適切にワーカーがサーバーに接続されるとサーバーに`X Workers ++`といったようなログが記録されます．
ここでSwaggerを利用したAPIが正しく動作するようになるので，traceなどに適切なURLを入力し動作検証を行います．

## 拡張機能の設定

ここまでの動作がSwaggerで確認できた場合は，拡張機能の設定からサーバーのドメインを入力します．正しく設定できた場合は保存に成功します．

以上ですべての作業が完了となります．