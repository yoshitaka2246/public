# リンク・ナビゲーション系のタグ
HTML5で定義されているタグは100種類以上あり、`<body>`内で使えるタグは約90種類である。この中から実務でよく使うタグを次のように分類し、タグの性質と使い方をまとめていく。今回は、**リンク・ナビゲーション系**のタグをまとめる。
|分類|主なタグ|用途|
|-------------|------------------------------|---------------|
|[**構造・セクション系**](structure.md)|`<header>`,`<main>`,`<footer>`,`section>`,`<article>`,`<aside>`,`<nav>`,`<div>`|ページ構造を作る|
|[**テキスト系**](text.md)|`<h1>`~`<h6>`,`<p>`,`<span>`,`<strong>`,`<em>`,`<br>`,`<hr>`,`<blockquote>`,`<code>`|文章や文字装飾|
|[**メディア系**](media.md)|`<img>`,`<picture>`,`<audio>`,`<video>`,`<canvas>`,`<svg>`|画像・動画・音声など|
|[**リンク・ナビゲーション系**](link.md)|`<a>`,`<button>`,`<ul>`,`<ol>`,`<li>`|リンクやメニュー|
|[**フォーム・入力系**](form.md)|`<form>`,`<input>`,`<textarea>`,`<select>`,`<option>`,`<label>`|入力フォーム関連|
|[**スクリプト・組み込み系**](script.md)|`<script>`,`<noscript>`,`<template>`|JSなどの埋め込み|
|[**その他**](others.md)|`<details>`,`<summary>`,`<table>`,`<tr>`,`<td>`,`<figure>`,`<figcaption>`|補助的な情報や表など|

## `<a>`タグ
`<a>`タグは、**HTMLの中でも最も基本的で重要なタグの一つ**です。aは**anchor(アンカー)**の略で、「他のページや場所に飛ぶためのリンク」を作るタグです。

**基本構文**
```html
<a href="https://example.com">サイトを見る</a>
```
このように書くと、「サイトを見る」という文字がクリックできるリンクになり、クリックすると`https://example.com`に移動します。


**主な属性**<br>
以下に主な属性をまとめます。
|属性名|説明|例|
|----------|------------------------|-------------------------------------------|
|`href`|リンク先のURLを指定|`<a href="/about.html">About</a>`|
|`target`|リンクの開き方を指定|`_self`(同じタブ) , `_blank`(新しいタブ)|
|`rel`|リンクの関係を指定(セキュリティやSEOに関係)|`rel="noopener noreferrer`|
|`download`|ファイルをダウンロードさせる|`<a href="photo.jpg" download>ダウンロード</a>`|
|`title`|補足説明(ホバー時に表示)|`<a href="/" title="ホームへ戻る">Home</a>`|


**使用例**
1. 外部サイトへのリンク
```html
   <a href="https://openai.com" target="_blank" rel="noopener noreferrer">OpenAI公式サイト</a>
```
**`target="_blank"`のときは、`rel="noopener noreferrer"`を必ずつける！！**

2. ページ内リンク
```html
<a href="#section2">第2章へジャンプ</a>

<h2 id="section2">第2章</h2>
```
3. メールリンク・電話リンク
```html
<a href="mailto:info@example.com">メールを送る</a>
<a href="tel:+819012345678">電話をかける</a>
```
4. ダウンロードリンク
```html
<a href="/files/manual.pdf" download>PDFをダウンロード</a>
```

## `<button>`タグ
`<button>`タグは、HTMLで**ユーザーがクリックできるボタン**を作るためのタグです。次のように設置します。
1.`<button id="exampleButtton">ボタン</button>`を設置  
2.JavaScriptファイルでidからボタンを認識し、クリックを監視して処理を書く  
```javascript
const Button=document.getElementById("exampleButton");
Button.addEventListener('click',()=>{
//ここに処理書く
})
```

## `<ul>`タグ
## `<ol>`タグ
## `<li>`タグ



