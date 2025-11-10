# exportとimport
JavaScriptにおける`export`は「このファイルで作った機能(関数、変数、クラス)を、他のファイルで使えるように公開する」ためのキーワードです。

例えるなら、「自分の工房で作った製品を、お店の棚に並べて他の人に買ってもらう」手続きのようなものです。
##　仕組みと実務での使い方
モダンなJavaScriptでは、ファイルを機能単位でわけ、必要な機能だけを取り込んで使います。この仕組みを実現するのが`export`と`import`のセットです。

## 1.名前付き`export`
    複数の機能や値を公開する場合に使います。受け取り側は、公開された名前を**そのまま使って取り込み**ます。
**ファイル：`utilities.js`(公開する側)**
```JavaScript
// 関数をエクスポート
export function add(a, b) {
  return a + b;
}

// 変数をエクスポート
export const PI = 3.14159;
```
**ファイル：`app.js`(利用する側)
```JavaScript
import {add,PI} from './utilities.js';

console.log(add(1,2)); //出力：3
console.log(PI); //出力：3.14159
```
## 2.`export default`
そのファイルが提供する**メインの機能**を一つだけ公開する場合に使います。ファイルごとに一つしか設定できません。
**ファイル：`math.js`(公開する側)
```JavaScript
// 関数をエクスポート
export default function add(a, b) {
  return a + b;
}
```
**ファイル：`app.js`(利用する側)
```JavaScript
import myAdd from './math.js';

console.log(myAdd(1,2)); //3
```
