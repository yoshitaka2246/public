import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

// ----------------------------------------------------
// 設定
// ----------------------------------------------------
const BUCKET_NAME = '*****'; 
const AWS_REGION = process.env.AWS_REGION || 'ap-northeast-3';
const s3Client = new S3Client({ region: AWS_REGION });
// ----------------------------------------------------

/**
 * Lambda メインハンドラ
 * バケット内のすべてのオブジェクトを削除する
 */
export async function handler(event) {
    console.log(`バケット [${BUCKET_NAME}] 内のすべてのオブジェクト削除処理を開始します...`);

    let continuationToken = undefined;
    let deletedCount = 0;
    let listCount = 0;

    try {
        do {
            // 1. オブジェクトをリストアップ (最大1000件)
            const listResponse = await s3Client.send(new ListObjectsV2Command({
                Bucket: BUCKET_NAME,
                ContinuationToken: continuationToken
            }));

            if (!listResponse.Contents || listResponse.Contents.length === 0) {
                if (listCount === 0) {
                    console.log("削除対象のオブジェクトは見つかりませんでした。");
                }
                break; // 削除対象なし、ループ終了
            }
            listCount++;

            // 2. 削除対象のキーリストを作成
            const objectsToDelete = listResponse.Contents.map(obj => ({ Key: obj.Key }));

            // 3. オブジェクトを一括削除
            const deleteResponse = await s3Client.send(new DeleteObjectsCommand({
                Bucket: BUCKET_NAME,
                Delete: { 
                    Objects: objectsToDelete,
                    Quiet: false // 削除結果（成功・失敗）を取得
                } 
            }));

            const deletedItems = deleteResponse.Deleted || [];
            deletedCount += deletedItems.length;
            
            // エラーがあった場合、ログに出力
            if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
                console.warn("一部のオブジェクト削除に失敗しました:", deleteResponse.Errors);
            }

            // 4. 続きのトークンがあればループ継続
            continuationToken = listResponse.NextContinuationToken;

        } while (continuationToken);

        console.log(`処理完了。合計 ${deletedCount} 件のオブジェクトを削除しました。`);
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