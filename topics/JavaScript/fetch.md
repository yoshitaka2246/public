# fetchの基本
JavascriptによるWebサイト同士の通信の中心技術であるfetchについてまとめます。

## 概要と基本構文
`fetch()`はjavascriptでhttp通信を行うための組み込み関数です。ブラウザからサーバーと通信して、データを**取得**(`GET`)したり、**送信**(`POST`, `PUT`, `DELETE`)したりできます。

**組み込み関数**

組み込み関数とは、プログラミング言語の言語仕様に最初から定義され、提供されている関数のことです。開発者が１から定義することなくさまざまな便利機能を使用することができます。代表的なものには、`console.log()`,`map()`などがあります。

## 基本構文と返り値
```JavaScript
fetch(url,options)
```
- url (string):通信先のエンドポイント
- options (object):メソッド、ヘッダー、ボディなど通信の設定を記述します。省略することもでき、その場合はGETメソッドとして働きます。optionsオブジェクトは次の３つのプロパティで構成されます。
  - method (string):使用するHTTPメソッド（例: `PUT`、`POST`, `DELETE`）
  - headers (Headers):HTTPヘッダー（送信データの型などを指定）
  - body (string):リクエストの本文（送信するデータ）。文字列として送る必要がある。

fetch処理はasyncを使った非同期処理で書くことが推奨されます。次のプログラムはGETリクエストの基本構文です。
methodにはGETの他に次のようなものがあります。
- **POST**：新規作成（サーバーに追加）
- **PUT**：既存のリソースを上書き（完全更新）
- **PATCH**：部分的な更新
- **DELETE**：指定リソースを削除

```JavaScript
async function getData() {
  try {
    const response = await fetch("https://api.example.com/data");

    // 通信成功かチェック
    if (!response.ok) {
      throw new Error(`HTTPエラー: ${response.status}`);
    }

    const data = await response.json(); 
    console.log("取得データ:", data);

  } catch (error) {
    console.error("Fetchエラー:", error);
  }
}

getData();
```
- `await`：Promiseが解決するまで待つことを宣言する構文です。
### responseオブジェクト
`fetch()`の呼び出し結果はPromiseとして返り、解決されると**Responseオブジェクト**が得られます。以下にResponseオブジェクトの主なプロパティとメソッドを示します。
- `status` (number):HTTPステータスコード（例：200, 404, 500など）
- `ok` (boolean):ステータスが 200〜299 の範囲なら true（成功判定によく使う）
- `statusText` (string):ステータスメッセージ（例："OK", "Not Found"）
- `url` (string):レスポンスのURL（リダイレクト後などに確認できる）
- `redirected` (boolean):リダイレクトが発生したかどうか
- `type` (string):レスポンスタイプ（例："basic", "cors", "error"）
- `headers` (Headersオブジェクト):レスポンスヘッダーをまとめたオブジェクト
- `text()` (Promise<string>):レスポンスを文字列として取得
- `json()` (Promise<object>):レスポンスをJSONとしてパース**(API通信で最もよく使う)**
- `blob()` (Promise<Blob>):バイナリデータとして取得（画像・ファイルなど）
- `formData()` (Promise<FormData>):フォーム送信データを取得（enctype="multipart/form-data"など）

**パース**

パースとは、json形式のデータを、プログラムで扱えるような形式にすることを言います。`response.json()`では、json形式の応答をJavaScriptで扱えるオブジェクトに変換して返します。

