# addEventListenerの使い方  
基本の書き方  
```JavaScript
要素.addEventListener('イベントの種類',実行したい関数);
```
## よく使うイベントの種類
#### マウスによる操作
- `click`:クリックされたとき
- `dblclick`:ダブルクリックされたとき
- `mousedown`:マウスボタンを押した瞬間
マウスに関するイベントは`mouseenter`や`mouseout`など多数ある。
#### キーボードによる操作
- `keydown`:キーを押した瞬間
- `keyup`:キーを離した瞬間
#### フォーム関連
- `submit`:フォームが送信された時
- `change`:値が変更された時（フォーカスが外れた瞬間に発火）
- `input`:入力内容が変わるたびに発火
- `focus`:要素にフォーカスがあたった時
- `blur`:要素からフォーカスが外れた時
#### ブラウザ関連
- `load`:ページや画像などの読み込みが完了した時
- `DOMContentLoaded`:HTMLが解析されてDOMツリーができたとき。（画像の読み込みは待たない）
- `resize`:サイズ変更された時
- `scroll`:スクロールされた時

## eventオブジェクトに入っている情報
`target.addEventListener('click',function(event));`のように実行したい関数にeventオブジェクトを引数として渡すことができる。
#### 主なプロパティ
- `type`:イベントの種類（'click'や'submit'）など
- `target`:実際にユーザーが操作した内側の要素
- `currentTarget`:イベントリスナーを登録した要素
```html
<div id="parent">
  <button id="child">button</button>
</div>
```
の場合、`event.target`はchild、`event.currentTarget`は、parent。

- `cancelable`:`preventDefault()`でキャンセルできるかどうか
- `defaultPrevented`:`preventDefault()`が呼ばれたかどうか
- `timeStamp`:イベントが発生した時刻
- `isTrusted`:ユーザー操作によるものか、スクリプトで発生されたか

#### 主なメソッド
- `preventDefault()`:ブラウザの規定の動作（フォーム送信やリンク移動）を阻止する。
- `stopPropagation()`:親要素へのバブリングを止める
- `stopImmediatePropagation()`:同じ要素に登録された他のイベントリスナーの発火を止める
- `getModifierState('CapsLock')`:特定のキーが押されているかを返す。
