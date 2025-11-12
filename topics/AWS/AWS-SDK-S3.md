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

