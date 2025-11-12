# AWS SDK for JavaScript -S3操作まとめ
## 概要
AWS SDK for JavaScript は、JavaScriptからAWSの各サービスを操作できる公式ライブラリです。

S3を使うことで、ファイルの**アップロード・ダウンロード・削除・一覧取得**などをコードで行うことができます。

## セットアップ
```bash
npm install @aws-sdk/client-s3
```
```js
import {S3Client} from "@aws-sdk/client-s3"

const s3 = new S3Client({
  region : "ap-northeast-1" //東京リージョン
  credentials : {
    accessKeyId: "YOUR_ACCESS_KEY",
    secretAccessKey: "YOUR_SECRET_KEY",
  },
});
```
- `import { S3Client } from "@aws-sdk/client-s3";` : AWS SDKでは、各サービスごとに独立したモジュールが提供されており、この行で、「S3クライアント(S3Client)」という**モジュールを読み込んでいます**。
- `const s3 = new S3Client({...});` : 実際にS3を操作するための **クライアント（接続オブジェクト）** を作成しています。以降の`putObject`,`getObject`はこの`s3`を通じて行います。
- `region: "ap-northeast-1"` : 操作対象のAWSリージョンを指定します。
- `credentials: {...}` : AWSのアクセスキー情報を指定します。これらのキーはIAMユーザーなどから取得します。

まとめると、このコードは **「東京リージョンのS3に接続できるクライアントを、指定したアクセスキーで作成する」** という意味になります。

## アップロード
S3にファイルをアップロードする手順を解説します。
### モジュールを読み込む
```js
import {PutObjectCommand} from "@aws-sdk/client-s3";
```
- `PutObjectCommand` : S3にファイルをアップロードする命令を使えるようにする **モジュール** をインポートします。

### アップロード関数を定義
```js
const upload = async () =>{
  ...
}
```
- 非同期処理を行うため、関数を`async`にしています。
- この中でアップロードの命令を実行します。
### PutObjectCommandを作成
実際にs3Clientを通じてS3に送信するコマンドを作成します。
```js
const command = new PutObjectCommand({
  Bucket : "BUCKET_NAME",
  Key : "images/sample.jpg" //ContentTypeで中身を指定するため拡張子はなんでも良い。
  Body : "Hello S3",
  ContentType : "text/plain",
});
```
- `Bucket` : アップロード先のS3バケット名。
- `Key` : バケット内のファイルパス。
- `Body` : 実際のファイルデータ。ここでは文字列を直接アップロード。
- `ContentType` : ファイルの種類（MIMEタイプ）。

### コマンドを送信
```js
await s3.send(command);
```
- `s3` : 「セットアップ」であらかじめ作成しておいたS3Clientのクライアントです。
- この1行で、実際にAWSへアップロードリクエストが送信されます。
- 成功するとAWSからステータスが帰ってきます。

### 関数を実行
```js
upload();
```
実際に関数を呼び出して、アップロードを行います。

## CacheControlについて
`CacheControl`は、S3上のオブジェクトがブラウザやCDNなどでどのようにキャッシュされるかを制御する設定です。

**CDN** : Content Delivery Network（コンテンツ配信ネットワーク）の略で、Webサイトの表示速度を速くし、安定性を高めるための仕組みです。AWSではAmazon CloudFrontが提供しています。

S3に画像やHTMLファイルをアップロードして静的WEBサイトホスティングしている場合、ブラウザやCDNがそのファイルをキャッシュして再利用します。

キャッシュすると通信が早くなりますが、HTMLファイルを更新してもすぐに反映されないことがあります。

その「キャッシュをどのくらい保持するか」を指定するのが`CacheControl`です。

上で説明した`command`で設定します。
```js
const command = new PutObjectCommand({
  Bucket: "my-bucket",
  Key: "index.html",
  Body: "<html>...</html>",
  ContentType: "text/html",
  CacheControl: "max-age=3600, public", // ←これ！
});
```
以下に主要な設定例をまとめます。
|設定値|意味|キャッシュ挙動|使われる場面|
|--------|-------------------------|-------------|--------------------------|
|`no-store`|一切キャッシュしない。ブラウザやCDNは保存も再利用もしない。|保存禁止|機密情報や、更新頻度が非常に高いデータ|
|`no-cache`|キャッシュは保存して良いが、**使う前に必ずサーバーへ確認する**。|保存OK・使用前確認|HTMLなど、**更新を即時反映したい**場合。|
|`max-age = <秒>`|キャッシュの有効期限を秒単位で指定する。期間内は再取得しない。|期間内は再利用OK|画像・CSSなどの変更の少ない静的ファイル|
|`public`|すべてのキャッシュで利用可能|誰でも再利用可|公開リソース|
|`private`|特定のユーザー専用。CDNなどには保存しない。|ブラウザのみ保存|個人ごとのデータ表示ページ|
|`must-revalidate`|有効期限が切れたら必ず再取得する。|期限切れ後に必ず確認|動的コンテンツに多い|
|`immutable`|コンテンツが変更されない前提で、強制的にキャッシュさせる|期限内は再確認しない|ファイル名にバージョンをつけて配信する場合|

`no-cache`と`no-store`の比較
|項目|`no-cache`|`no-store`|
|-----|---------------|-------------------|
|保存|一時的に保存して良い|保存自体が禁止|
|使用時|使用前に必ず再確認|そもそも保存しないので再確認なし|
|更新反映|即時反映される|常にサーバーから取得|
|主な用途|頻繁に更新されるHTMLなど|セキュリティが重要な認証情報などのデータ|


