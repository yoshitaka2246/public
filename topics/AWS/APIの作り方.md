# API処理の仕組み
今回は、AWSで簡単なAPIを作成することを通じて、API処理の仕組みについて解説していきます。
## GET処理
ブラウザや`fetch()`で以下のURLを叩くと、
```bash
https://xxxxxx.execute-api.ap-northeast-1.amazonaws.com/hello
```
↓こんなJSONが帰って来るAPIを作ります↓
```json
{"message":"Hello from AWS Lambda!"}
```
### ステップ１：Lambda関数を作成
1. AWSコンソールで**Lambda**を検索して開く
2. 「関数の作成」→「一から作成」
   1. 関数名：`helloJSHandler`
   2. ランタイム：**Node.js**
3. 作成後、コードエディタを開いて以下を貼り付け
```JavaScript
export async function handler(event){
  // API Gatewayから送られてくるリクエスト情報をログで確認
  console.log("event:", event);

  // レスポンスを返す
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*", // CORS対応
    },
    body: JSON.stringify({
      message: "Hello from JavaScript Lambda!",
      method: event.httpMethod
    }),
  };
};
```
### ステップ２：API Gatewayを設定
1. AWSコンソールで**API Gateway**を検索して開く
2. 「HTTP APIを作成」を選択
3. 「統合を追加」→Lambda関数→`helloJsHandler`を選択
4. ルートを設定
   1. メソッド：`GET`
   2. パス：`/hello`
5. **デプロイ**
6. **API Gateway**内で、作成したAPIを選択肢、左のメニューバーから「Stages」を選択。表示されたURLを叩いてAPIの動作を確認。
#### `handler`
Lambdaの実行環境は、**`handler`という名前のエクスポートされた関数**を探して実行するため、`handler`はLambdaが実行する「エントリーポイント（入り口）」となります。
ハンドラー関数の名前はLambdaで設定できますが、デフォルトでは`handler`が設定されています。そのため、Lambdaで実行したいエントリーポイントとなる関数の名前は必ず`handler`でなければなりません。
``` Javascript
export function handler(event){

}
```
#### `return`構成について
JavaScriptを用いて、AWS LambdaとAPI gatewayを組み合わせて**RESTful API**を構築する場合、関数が`return`するオブジェクトには、決まったフォーマットがあります。`return`されるオブジェクトは**HTTPレスポンス**としてwebブラウザに返されるための情報を含んでいる必要があるからです。
`return`オブジェクトの構造は、次のとおりです。この内、`statusCode`だけが必須で、ほかは任意です。
1. `statusCode` (Number)
2. `headers` (Object)
3. `body` (String)
##### `statusCode(ステータスコード)`
クライアント（ブラウザなど）に対して、リクエストが**どのような結果になったか**を伝えるための3桁の数字です。
|範囲|意味|値の例と構造|
|-----|----------------|----------------------------------------------|
|2xx|**成功**|`200`(OK):jリクエストが成功し、データが返される。<br>`201`(Created):新しいデータが作成された。|
|4xx|**クライアントエラー**|`400`(Bad Request):クライアントからのリクエスト内容に問題がある(入力データが不正など)<br>`401`(Unauthorized):認証が必要だが、認証情報がない。<br>`404`(Not Found):リクエストされたリソース(URL)が見つからない。|
|5xx|**サーバーエラー**|`500`(Internal Server Error):サーバー側で予期せぬエラーが発生した。<br>`503`(Service Unavailable):サーバーが一時的にカフカなどで応答できない。|
**目的に応じた適切なステータスコードを返すことがAPIの品質にとって非常に重要です。**

##### `headers`(ヘッダー)
`headers`は**キーと値のペア**を持つJavaScriptのオブジェクトです。クライアントとサーバー間の通信に関するメタ情報を持たせます。
|キー|意味|取りうる値|
|------------|---------------|---------------|
|`Content-Type`|`body`で返しているデータの形式|`'application/json'`(bodyはjsonデータ),`'text/html'`,`'image/jpeg'`など|
|Access-Control-Allow-Origin|**CORS**の設定|`'*'`(すべてのドメイン),`'https://example.com'`など|
|Cache-Control|クライアント側でのキャッシュ方法の指示|`'no-cache'`,`'max-age=3600'`など|
`headers`を適切に設定しないと、エラーでデータが受け取れないことがあるので非常に重要です。
##### `body`(ボディ)
クライアントに返す実際のデータ本体です。ほとんどの場合、データはJSON形式の文字列として返されます。しかし、HTTPレスポンスにおいては`body`は**文字列である必要がある**ため、JavaScriptのオブジェクトや配列を`JSON.stringify()`を使って文字列に変換する作業が必要です。