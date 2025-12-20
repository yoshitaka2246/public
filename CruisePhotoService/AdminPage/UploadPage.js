// 🚨 あなたのアップロード用 API Gateway の呼び出し URL に置き換えてください！
const API_GATEWAY_URL = '*****'; 
const CATALOG_API_URL = '*****'; 
// --- HTML要素の取得 ---
const dateInput = document.getElementById('date');
const cruiseSelect = document.getElementById("CruiseId");
const fileInput = document.getElementById("fileInput");
const uploadButton = document.getElementById("uploadButton");
const statusBox = document.getElementById("status");

// --- イベントリスナー ---
uploadButton.addEventListener('click', () => {
    // 処理中にボタンを無効化し、ステータスをリセット
    uploadButton.disabled = true; 
    statusBox.textContent = "写真のアップロードを開始します...";
    uploadFilesBatch();
});

// --- 日付整形ヘルパー関数 ---
function formatLocalDateYYYYMMDD(d) {
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function getDateFromInput(inputEl) {
    // input type="date" の値から Date オブジェクトを取得する
    if (inputEl.valueAsDate) {
        return inputEl.valueAsDate;
    }
    const v = inputEl.value; 
    if (!v) return null;
    const [y, m, d] = v.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}

// --- メインアップロードロジック ---
async function uploadFilesBatch() {
    // 1. フォーム情報の取得とバリデーション
    const dateObj = getDateFromInput(dateInput);
    const uploadDate = formatLocalDateYYYYMMDD(dateObj); // YYYY-MM-DD 形式
    const cruiseValue = cruiseSelect.value;
    // 例: 1 -> CRUISE-001 に変換
    const cruiseId = `CRUISE-${cruiseValue.padStart(3, '0')}`; 
    
    const files = fileInput.files;

    if (files.length === 0 || !uploadDate) {
        statusBox.textContent = "「日付」と「アップロードしたい写真」を選択してください。";
        uploadButton.disabled = false;
        return;
    }
    
    let uploadedCount = 0;
    let failedCount = 0;

    // FileListを配列に変換し、Promiseの配列を生成
    const uploadPromises = Array.from(files).map(async (file, index) => {
        const fileNumber = index + 1; // 1から始まるファイル番号
        
        try {
            // 1-1. Lambdaからアップロード用署名付きURLを取得
            const url = new URL(API_GATEWAY_URL);
            // クエリパラメータを設定
            url.searchParams.append('fileName', file.name);
            url.searchParams.append('date', uploadDate);
            url.searchParams.append('cruiseId', cruiseId);
            url.searchParams.append('fileNumber', fileNumber);
            url.searchParams.append('contentType', file.type); // Lambdaの PutObjectCommand で使用

            statusBox.textContent = `[${fileNumber}/${files.length}] ${file.name} を準備中...`;

            const urlResponse = await fetch(url.toString());
            if (!urlResponse.ok) throw new Error(`URL取得失敗: ${urlResponse.statusText}`);
            
            const result = await urlResponse.json();
            
            // 応答が文字列化されている可能性があるため安全にパース
            const data = typeof result.body === 'string' ? JSON.parse(result.body) : result;
            const uploadUrl = data.uploadUrl;
            const s3Key = data.s3Key; 

            // 1-2. 署名付きURLを使ってS3へ直接PUTアップロード
            statusBox.textContent = `[${fileNumber}/${files.length}] ${file.name}: S3へアップロード中...`;
            
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                // S3に直接アップロードする場合、Content-Typeヘッダーは必須
                headers: {
                    'Content-Type': file.type, 
                },
                body: file, // ファイルの生データを送信
            });

            if (!uploadResponse.ok) {
                throw new Error(`S3アップロード失敗: ${uploadResponse.status} ${uploadResponse.statusText}`);
            }

            uploadedCount++;
            console.log(`アップロード成功: ${s3Key}`);
            return { status: 'success', key: s3Key };

        } catch (error) {
            failedCount++;
            console.error(`アップロード失敗 (${file.name}):`, error);
            // 失敗したファイル名を具体的に表示
            statusBox.innerHTML = statusBox.innerHTML + `<br><strong>${file.name}</strong> のアップロードに失敗しました。`;
            return { status: 'failed', name: file.name, error: error.message };
        }
    });

    // すべてのアップロード完了を待機
    await Promise.all(uploadPromises);

    // 最終ステータスの表示
    const finalMessage = failedCount === 0
        ? `✅ <strong>${uploadedCount} 件全ての写真が完了しました！<strong>`
        : `<strong>アップロード完了: ${uploadedCount} 件、失敗: ${failedCount} 件。<strong>`;
        
    statusBox.innerHTML = finalMessage;

    //カタログ生成のトリガー
    if(failedCount === 0){
        statusBox.innerHTML += "<br><strong>写真アップロード完了。カタログ生成を開始します...</strong>";

        try{
            const CatalogResponse=await  triggerCatalogGeneration(uploadDate,cruiseId);
            statusBox.innerHTML=`<strong>カタログ（一覧）が完成しました！</strong>`
        }catch(error){
            statusBox.innerHTML+=`<br><strong>カタログ生成リクエストに失敗しました。</strong> ${error.message}`;

        }
    }
    uploadButton.disabled = false;
}

async function triggerCatalogGeneration(date, cruiseId) {
    const dataToSend = {
        date: date,
        cruiseId: cruiseId
    };

    const response = await fetch(CATALOG_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
    });

    if (!response.ok) {
        throw new Error(`API呼び出し失敗: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
}