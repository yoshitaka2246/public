# 構造・セクション系のタグ
HTML5で定義されているタグは100種類以上あり、`<body>`内で使えるタグは約90種類である。この中から実務でよく使うタグを次のように分類し、タグの性質と使い方をまとめていく。今回は、**構造・セクション系**のタグをまとめる。
|分類|主なタグ|用途|
|-------------|------------------------------|---------------|
|[**構造・セクション系**](structure.md)|`<header>`,`<main>`,`<footer>`,`section>`,`<article>`,`<aside>`,`<nav>`,`<div>`|ページ構造を作る|
|[**テキスト系**](text.md)|`<h1>`~`<h6>`,`<p>`,`<span>`,`<strong>`,`<em>`,`<br>`,`<hr>`,`<blockquote>`,`<code>`|文章や文字装飾|
|[**メディア系**](media.md)|`<img>`,`<picture>`,`<audio>`,`<video>`,`<canvas>`,`<svg>`|画像・動画・音声など|
|[**リンク・ナビゲーション系**](link.md)|`<a>`,`<button>`,`<ul>`,`<ol>`,`<li>`|リンクやメニュー|
|[**フォーム・入力系**](form.md)|`<form>`,`<input>`,`<textarea>`,`<select>`,`<option>`,`<label>`|入力フォーム関連|
|[**スクリプト・組み込み系**](script.md)|`<script>`,`<noscript>`,`<template>`|JSなどの埋め込み|
|[**その他**](others.md)|`<details>`,`<summary>`,`<table>`,`<tr>`,`<td>`,`<figure>`,`<figcaption>`|補助的な情報や表など|

## `<header>`タグ
`<header>`タグは、HTML５で導入された**セクション要素**の一つで、**その部分の導入やナビゲーションをまとめる**役割を持つタグです。

大きくわけて以下の２つの使い方があります。
1. **ページ全体のヘッダー**
  サイトのトップに表示されるヘッダー部分で、ロゴ・サイト名・ナビゲーションなどを含めるのが一般的です。
  ```html
  <header>
  <h1>My Portfolio</h1>
  <nav>
    <ul>
      <li><a href="#works">Works</a></li>
      <li><a href="#about">About</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>
  </nav>
</header>
```
**関連** : [<ul>](topics/HTML/body/link.md) , [<li>](topics/HTML/body/link.md) , [<a>](topics/HTML/body/link.md)

2. **セクションごとのヘッダー**
`<article>`や`<section>`のなかでも使用可能で、そのセクションの見出しや説明を含めると、構造をより明確にすることができます。
```html
<article>
  <header>
    <h2>最新のお知らせ</h2>
    <p>2025年10月12日 更新</p>
  </header>
  <p>新しいサービスを開始しました！</p>
</article>
```
**関連** : [<h2>](topics/HTML/body/text.md) , [<p>](topics/HTML/body/text.md)

## `<main>`タグ

## `<footer>`

## `<section>`


## `<article>`


## `<aside>`


## `<nav>`
`<nav>`は、ナビゲーション(**移動リンク**)をまとめるためのHTMLタグです。ページ内の「主要なリンク集」を表示し、ユーザーがサイト内を移動しやすくするために使います。セマンティックな（意味的な）タグのため、<div>で代用することもできますが、SEO対策や構造の明確化のために使用が推奨されています。
```html
<nav>
  <a href="/">Home</a>
  <a href="/about">About</a>
  <a href="/contact">Contact</a>
</nav>
```
**関連** [<a>](link.md)
## `<div>`


