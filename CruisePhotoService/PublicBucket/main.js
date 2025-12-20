// main.js

// 🚨 修正: タイマーの更新対象を #timer-time span に変更
const timerTimeElement = document.getElementById('timer-time'); 
const dataElement = document.getElementById('photo-data');

if (timerTimeElement && dataElement) {
    // HTMLのdata属性からタイマー開始時刻（ミリ秒）を取得
    const startTime = parseInt(dataElement.dataset.startTime, 10);
    
    // 30分後の終了時刻を計算
    const EXPIRE_DURATION_MS = 30 * 60 * 1000;
    const endTime = startTime + EXPIRE_DURATION_MS; 

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = endTime - now;

        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (distance < 0) {
            timerTimeElement.innerHTML = "Expired"; // 期限切れ
            clearInterval(interval);
        } else {
            // 🚨 修正: 時間の部分だけを上書き
            timerTimeElement.innerHTML = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }

    // ページロード時にタイマーを起動
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

} else {
    // エラーハンドリング (要素が見つからない場合)
    console.error("タイマーまたはデータ要素が見つかりませんでした。");
}

// =======================================================
// ライトボックスロジック
// =======================================================

// 1. グローバル変数の準備 (変更なし)
let currentPhotoIndex = 0;
const allPhotos = [];

// 2. DOM要素の取得
const photoTriggers = document.querySelectorAll('.lightbox-trigger');
const modal = document.getElementById('lightbox-modal');
const modalImg = document.getElementById('lightbox-image');
const closeBtn = document.querySelector('.lightbox-close');
const prevBtn = document.querySelector('.lightbox-prev');
const nextBtn = document.querySelector('.lightbox-next');
const hintBox = document.getElementById('download-hint-box'); // 🚨 追加: ヒントボックス

// 3. 写真リストの初期化 (変更なし)
photoTriggers.forEach(trigger => {
    allPhotos.push({
        src: trigger.dataset.fullUrl,
        alt: trigger.dataset.filename
    });
});

// 4. 関数: モーダルを開く
function openModal(index) {
    if (index < 0 || index >= allPhotos.length) return;
    
    currentPhotoIndex = index;
    const photo = allPhotos[currentPhotoIndex];
    
    // 画像の情報を更新
    modalImg.src = photo.src;
    
    modal.style.display = 'flex';
    
    // 🚨 追加: ヒントボックスの言語を更新
    updateLanguageHint();
}

// 5. 関数: モーダルを閉じる (変更なし)
function closeModal() {
    modal.style.display = 'none';
}

// 6. 関数: 次の写真へ (変更なし)
function showNext() {
    const nextIndex = (currentPhotoIndex + 1) % allPhotos.length;
    openModal(nextIndex);
}

// 7. 関数: 前の写真へ (変更なし)
function showPrev() {
    const prevIndex = (currentPhotoIndex - 1 + allPhotos.length) % allPhotos.length;
    openModal(prevIndex);
}

// 8. 🚨 追加: 言語ヒントの制御（ブラウザ言語に基づく）
function updateLanguageHint() {
    if (!hintBox) return; // ヒントボックスがなければ何もしない
    
    const userLang = (navigator.language || navigator.userLanguage).substring(0, 2);
    
    // 全ての言語ヒントを非表示にする
    hintBox.querySelectorAll('p').forEach(p => {
        p.style.display = 'none';
    });
    
    // ユーザーの言語に一致するものを表示、なければ英語（en）を表示
    const langToShow = ['ja', 'en', 'zh', 'ko'].includes(userLang) ? userLang : 'en';
    
    const targetElement = hintBox.querySelector(`p[data-lang="${langToShow}"]`);
    if (targetElement) {
        targetElement.style.display = 'block';
    } else {
        // フォールバック（英語）
        hintBox.querySelector(`p[data-lang="en"]`).style.display = 'block';
    }
}

// 10. イベントリスナーの設定 (変更なしの部分)
photoTriggers.forEach(trigger => {
    trigger.addEventListener('click', function(e) {
        e.preventDefault();
        const index = parseInt(this.dataset.index, 10);
        openModal(index);
    });
});

closeBtn.addEventListener('click', closeModal);
nextBtn.addEventListener('click', showNext);
prevBtn.addEventListener('click', showPrev);

modal.addEventListener('click', (e) => (e.target === modal) && closeModal());