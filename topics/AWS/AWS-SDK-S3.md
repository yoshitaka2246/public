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