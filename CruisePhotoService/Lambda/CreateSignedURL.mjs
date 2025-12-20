import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: 'ap-northeast-3' });
const BUCKET_NAME = '*****'; //写真を保存するプライベートバケットの名前

export const handler = async (event) => {
    // API Gatewayプロキシ統合からクエリパラメータを取得
    const params = event.queryStringParameters || {};
    
    // 必須パラメータの取得
    const fileName = params.fileName; 
    const date = params.date;         // 例: 2025-10-07
    const cruiseId = params.cruiseId; // 例: CRUISE-001
    const fileNumber = params.fileNumber;
    
    // パラメータのバリデーション
    if (!fileName || !date || !cruiseId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'ファイル名、日付、便番号が必要です。' }),
        };
    }

    // 新しいファイル名を生成 (拡張子は一度だけ付与)
    // S3キー例: 2025-10-07/CRUISE-001/photo1.jpg
    let photoname = "photo" + fileNumber + ".jpg";
    
    const s3Key = `${date}/${cruiseId}/${photoname}`;
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME, 
        Key: s3Key, 
        ContentType: params.contentType || 'image/jpeg', 
    });

    // 5分以内にアップロードを完了させるための有効期限
    const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 60 * 5, 
    });

    // S3キーとアップロードURLの生成処理が完了した後
    return { 
        // 🚨 以下のヘッダーは、ブラウザからのCORSリクエストを許可するために必要です
        headers: {
            'Access-Control-Allow-Origin': '*****', /*管理者ページ*/ 
            'Access-Control-Allow-Methods': 'GET,OPTIONS', 
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        },
        statusCode: 200, 
        body: JSON.stringify({ 
            uploadUrl: uploadUrl,
            s3Key: s3Key
        }) 
    };
};