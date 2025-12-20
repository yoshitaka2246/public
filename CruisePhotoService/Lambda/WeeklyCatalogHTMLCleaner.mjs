import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

// ----------------------------------------------------
// 設定
// ----------------------------------------------------
// 🚨 削除対象の公開バケット名
const BUCKET_NAME = '*****'; 
const AWS_REGION = process.env.AWS_REGION || 'ap-northeast-3';

// このバケットで【削除しない】ファイル（= 常に保持するファイル）のリスト
const KEEP_FILES = [
    'latest.html',    // デジタルサイネージ用の固定ページ
    'qrcode.png',     // 受付用の固定QRコード
    'style.css',      // カタログのCSS
    'main.js',        // カタログのJavaScript
    'qrcode.html'
];
// ----------------------------------------------------

const s3Client = new S3Client({ region: AWS_REGION });

/**
 * Lambda メインハンドラ
 */
export async function handler(event) {
    console.log(`公開バケット [${BUCKET_NAME}] のクリーンアップ処理を開始します...`);
    console.log(`以下のファイルは保持します: ${KEEP_FILES.join(', ')}`);

    let continuationToken = undefined;
    let deletedCount = 0;
    let scannedCount = 0;

    try {
        do {
            // 1. オブジェクトをリストアップ (最大1000件)
            const listResponse = await s3Client.send(new ListObjectsV2Command({
                Bucket: BUCKET_NAME,
                ContinuationToken: continuationToken
            }));

            if (!listResponse.Contents || listResponse.Contents.length === 0) {
                break; // 処理対象なし
            }
            scannedCount += listResponse.Contents.length;

            // 2. 削除対象のキーリストを作成 (KEEP_FILES に含まれていないものだけ)
            const objectsToDelete = listResponse.Contents
                .map(obj => obj.Key)
                .filter(key => !KEEP_FILES.includes(key)) // 保持リストに含まれていないファイル
                .map(key => ({ Key: key })); // 削除コマンドのフォーマットに変換

            if (objectsToDelete.length === 0) {
                console.log("このバッチに削除対象ファイルはありませんでした。");
                continuationToken = listResponse.NextContinuationToken;
                continue; // 次のバッチへ
            }

            // 3. オブジェクトを一括削除
            const deleteResponse = await s3Client.send(new DeleteObjectsCommand({
                Bucket: BUCKET_NAME,
                Delete: { Objects: objectsToDelete }
            }));

            const deletedItems = deleteResponse.Deleted || [];
            deletedCount += deletedItems.length;
            console.log(`${deletedItems.length} 件のオブジェクトを削除しました。`);

            // 4. 続きのトークンがあればループ継続
            continuationToken = listResponse.NextContinuationToken;

        } while (continuationToken);

        console.log(`処理完了。合計 ${scannedCount} 件をスキャンし、 ${deletedCount} 件のオブジェクトを削除しました。`);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Total ${deletedCount} objects deleted.` })
        };

    } catch (error) {
        console.error(`処理中に致命的なエラーが発生しました:`, error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
}