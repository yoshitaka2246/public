import { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import qrcode from 'qrcode'; 

const PHOTO_BUCKET = '*****'; 
const CATALOG_BUCKET = '*****'; 
const AWS_REGION = process.env.AWS_REGION || '*****'; 

const CLOUDFRONT_DOMAIN = '*******'

const s3Client = new S3Client({ region: AWS_REGION });

// =======================================================
// ヘルパー関数
// =======================================================

async function getPhotoList(prefix) {
    const command = new ListObjectsV2Command({
        Bucket: PHOTO_BUCKET,
        Prefix: prefix, 
    });

    try {
        const response = await s3Client.send(command);
        if (response.Contents) {
            return response.Contents
                .map(item => item.Key) 
                .filter(key => key !== prefix) 
                .map(key => key.substring(prefix.length)); 
        }
        return [];
    } catch (error) {
        console.error("S3ファイルリストの取得エラー:", error);
        throw new Error("写真リストの取得に失敗しました。");
    }
}

async function putContentToS3(key, content, contentType) {
    const command = new PutObjectCommand({
        Bucket: CATALOG_BUCKET,
        Key: key, 
        Body: content,
        ContentType: contentType, 
        CacheControl: 'no-cache, no-store, must-revalidate', 
    });

    try {
        await s3Client.send(command);
    } catch (error) {
        console.error(`S3書き込みエラー (${key}):`, error);
        throw new Error("公開用S3への書き込みに失敗しました。IAM権限を確認してください。");
    }
}

// HTML生成関数

async function generateHtmlCatalog(date, cruiseId, photoList) {
    // 署名付きURLの生成
    const urlPromises = photoList.map(photoFileName => {
        const key= `${date}/${cruiseId}/${photoFileName}`;
        const command = new GetObjectCommand({
            Bucket: PHOTO_BUCKET,
            Key: key
        });
        return getSignedUrl(s3Client, command, { expiresIn: 60 * 30 })
            .then(signedUrl => ({ fileName: photoFileName, url: signedUrl }));
    });

    const signedPhotoUrls = await Promise.all(urlPromises); 

    const photoHtml = signedPhotoUrls.map((item, index) => {
        return `
            <div class="photo-item">
                <img src="${item.url}" 
                     alt="${item.fileName}" 
                     class="lightbox-trigger"
                     data-index="${index}"
                     data-full-url="${item.url}"
                     data-filename="${item.fileName}">
            </div>
        `;
    }).join('');
    
    const startTimeMs = Date.now();
    //アンケート情報をDynamoに保存するAPI
    const API_URL = '*****'; 

    const feedbackScript = `
<style>
    /* --- 基本設定 --- */
    :root { --primary-color: #0099ff; --bg-overlay: rgba(0,0,0,0.85); }
    
    /* モーダル */
    .modal-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: var(--bg-overlay);
        z-index: 9999; display: none; /* 初期非表示 */
        justify-content: center; align-items: center;
        backdrop-filter: blur(4px);
    }
    .modal-content {
        background: #fff; width: 90%; max-width: 450px;
        border-radius: 16px; padding: 24px;
        max-height: 90vh; overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        animation: slideUp 0.3s ease-out;
    }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .feedback-container {
        margin: 40px auto; 
        width: 96%; /* 写真グリッドに合わせて微調整 */
        max-width: 600px;
        box-sizing: border-box; /* ★重要: paddingを幅に含めてはみ出しを防ぐ */
        background: #fff; border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        padding: 25px; text-align: center;
        font-family: sans-serif; color: #333;
        display: none; /* 初期非表示 */
    }
    /* --- NPS (横スクロール) --- */
    .nps-scroll-container {
        display: flex; overflow-x: auto; gap: 8px;
        padding: 10px 5px; margin: 10px -10px;
        padding-left: 10px; padding-right: 10px;
        scrollbar-width: none; -webkit-overflow-scrolling: touch;
    }
    .nps-scroll-container::-webkit-scrollbar { display: none; }
    
    .nps-btn {
        flex: 0 0 auto; width: 42px; height: 42px;
        border: 1px solid #ddd; background: #fff; color: #333;
        border-radius: 50%; font-size: 16px; font-weight: bold;
        display: flex; justify-content: center; align-items: center;
        transition: 0.2s; cursor: pointer;
    }
    .nps-btn.selected {
        background: var(--primary-color); color: white; border-color: var(--primary-color);
        transform: scale(1.1); box-shadow: 0 4px 10px rgba(0,153,255,0.3);
    }
    .nps-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: #888; margin-bottom: 15px; }

    /* --- 星評価 --- */
    .star-container { display: flex; justify-content: center; gap: 8px; margin: 10px 0 20px; }
    .star-btn { font-size: 38px; color: #e0e0e0; cursor: pointer; transition: 0.2s; line-height: 1; }
    .star-btn.active { color: #ffc107; transform: scale(1.1); }

    /* --- 共通UI要素 --- */
    h3 { margin: 0 0 15px; font-size: 1.1rem; color: #003366; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; text-align: left; }
    label.q-label { display: block; margin-top: 20px; font-weight: bold; text-align: left; font-size: 0.95rem; color: #444; }
    .sub-text { font-size: 0.8rem; color: #777; margin-bottom: 15px; text-align: left; }
    
    /* ラジオボタン群 */
    .btn-group { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 20px; }
    .radio-btn { display: none; }
    .radio-label {
        padding: 8px 14px; background: #f7f7f7; border: 1px solid #e0e0e0;
        border-radius: 20px; font-size: 0.85rem; cursor: pointer; transition: 0.2s;
    }
    .radio-btn:checked + .radio-label {
        background: var(--primary-color); color: white; border-color: var(--primary-color);
    }

    /* ボタン */
    .nav-btns { margin-top: 30px; display: flex; justify-content: space-between; gap: 10px; }
    .btn-main {
        flex: 1; background: var(--primary-color); color: white; border: none;
        padding: 14px; border-radius: 8px; font-size: 16px; font-weight: bold;
        cursor: pointer; box-shadow: 0 4px 10px rgba(0,153,255,0.2); transition: 0.2s;
    }
    .btn-main:disabled { background: #ccc; box-shadow: none; cursor: not-allowed; }
    .btn-sub {
        background: #f0f0f0; color: #555; border: none; padding: 12px 20px;
        border-radius: 8px; font-weight: bold; cursor: pointer;
    }

    /* フォーム要素 */
    select { width: 100%; padding: 12px; margin-top: 5px; border-radius: 8px; border: 1px solid #ccc; background: #fafafa; font-size: 16px; }
    textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ccc; font-family: sans-serif; resize: vertical; margin-top:5px; }
    
    hr.divider { border: 0; border-top: 1px dashed #ddd; margin: 25px 0; }
    #input-nation-other { display: none; width: 100%; padding: 10px; margin-top: 10px; border: 1px solid #ccc; border-radius: 6px; }
</style>

<div id="survey-modal" class="modal-overlay">
    <div class="modal-content">
        
        <div id="modal-step1" class="wizard-step" style="display:block;">
            <h3 data-i18n="s1_title">Step 1/2: Satisfaction Survey</h3>
            <p class="sub-text" style="color:#d9534f;" data-i18n="req_msg">Complete the survey to see your photos.</p>

            <label class="q-label" data-i18n="q_nps">Would you recommend us?</label>
            <div class="nps-scroll-container" id="grp-nps"></div>
            <div class="nps-labels"><span>0</span><span>10</span></div>

            <label class="q-label" data-i18n="q_guide">Guide's Performance</label>
            <div class="star-container" id="grp-guide">
                <span class="star-btn" onclick="selectStar('guide', 1)">★</span>
                <span class="star-btn" onclick="selectStar('guide', 2)">★</span>
                <span class="star-btn" onclick="selectStar('guide', 3)">★</span>
                <span class="star-btn" onclick="selectStar('guide', 4)">★</span>
                <span class="star-btn" onclick="selectStar('guide', 5)">★</span>
            </div>

            <label class="q-label" data-i18n="q_photo">Photo Service</label>
            <div class="star-container" id="grp-camera">
                <span class="star-btn" onclick="selectStar('camera', 1)">★</span>
                <span class="star-btn" onclick="selectStar('camera', 2)">★</span>
                <span class="star-btn" onclick="selectStar('camera', 3)">★</span>
                <span class="star-btn" onclick="selectStar('camera', 4)">★</span>
                <span class="star-btn" onclick="selectStar('camera', 5)">★</span>
            </div>

            <div class="nav-btns">
                <button id="btn-step1-next" class="btn-main" onclick="nextModal(1)" data-i18n="btn_next" disabled>Next ➡</button>
            </div>
        </div>

        <div id="modal-step2" class="wizard-step" style="display:none;">
            <h3 data-i18n="s2_title">Step 2/4: About You</h3>
            
            <label class="q-label" data-i18n="q_nation">Nationality / Region</label>
            <select id="sel-nation" onchange="handleNationChange(this.value)">
                <option value="" disabled selected>Select your country/region</option>
                <optgroup label="Western / Oceania">
                    <option value="USA">🇺🇸 USA</option>
                    <option value="UK">🇬🇧 UK</option>
                    <option value="Australia">🇦🇺 Australia</option>
                    <option value="Canada">🇨🇦 Canada</option>
                    <option value="France">🇫🇷 France</option>
                    <option value="Germany">🇩🇪 Germany</option>
                    <option value="Italy">🇮🇹 Italy</option>
                    <option value="Spain">🇪🇸 Spain</option>
                    <option value="Mexico">🇲🇽 Mexico</option>
                </optgroup>
                <optgroup label="Asia">
                    <option value="Japan">🇯🇵 Japan (日本)</option>
                    <option value="South Korea">🇰🇷 South Korea (대한민국)</option>
                    <option value="Taiwan">🇹🇼 Taiwan (台灣)</option>
                    <option value="Hong Kong">🇭🇰 Hong Kong (香港)</option>
                    <option value="China">🇨🇳 China (中国)</option>
                    <option value="Thailand">🇹🇭 Thailand (ไทย)</option>
                    <option value="Vietnam">🇻🇳 Vietnam (Việt Nam)</option>
                    <option value="Philippines">🇵🇭 Philippines</option>
                    <option value="Indonesia">🇮🇩 Indonesia</option>
                    <option value="Malaysia">🇲🇾 Malaysia</option>
                    <option value="Singapore">🇸🇬 Singapore</option>
                </optgroup>
                <optgroup label="Others">
                    <option value="Brazil">🇧🇷 Brazil</option>
                    <option value="Russia">🇷🇺 Russia</option>
                    <option value="UAE">🇦🇪 UAE</option>
                    <option value="Other">🌍 Other</option>
                </optgroup>
            </select>
            <input type="text" id="input-nation-other" placeholder="Please specify">

            <div class="nav-btns">
                <button class="btn-sub" onclick="backModal(2)" data-i18n="btn_back">⬅ Back</button>
                <button id="btn-step2-finish" class="btn-main" onclick="finishModal()" data-i18n="btn_next" disabled>Next ➡</button>
            </div>
        </div>
    </div>
</div>

<div class="feedback-container" id="bottom-survey-area">
    <input type="hidden" id="cruise-date" value="${date}">
    <input type="hidden" id="cruise-time" value="${cruiseId}">

    <div id="bottom-thanks" style="display:none;">
        <h3 data-i18n="done_title">Thank You!</h3>
        <p data-i18n="done_msg">We appreciate your feedback.</p>
        <p style="margin-top:20px; font-size:0.95rem; background:#f0f8ff; padding:15px; border-radius:8px;" id="review-req"></p>
    </div>

    <div id="bottom-form">
        <label class="q-label" data-i18n="q_companion" style="margin-top:0;">Who are you with?</label>
        <div class="btn-group">
            <input type="radio" name="companion" id="c1" value="Family" class="radio-btn"><label for="c1" class="radio-label" data-i18n="opt_family">Family</label>
            <input type="radio" name="companion" id="c2" value="Couple" class="radio-btn"><label for="c2" class="radio-label" data-i18n="opt_couple">Couple</label>
            <input type="radio" name="companion" id="c3" value="Friends" class="radio-btn"><label for="c3" class="radio-label" data-i18n="opt_friends">Friends</label>
            <input type="radio" name="companion" id="c4" value="Solo" class="radio-btn"><label for="c4" class="radio-label" data-i18n="opt_solo">Solo</label>
        </div>

        <hr class="divider">

        
        <label class="q-label" data-i18n="q_booking">Booking Channel</label>
        <div class="btn-group">
            <input type="radio" name="booking" id="b1" value="Walk-in" class="radio-btn"><label for="b1" class="radio-label" data-i18n="bk_walkin">Walk-in (Ticket Booth)</label>
            <input type="radio" name="booking" id="b2" value="Klook" class="radio-btn"><label for="b2" class="radio-label">Klook</label>
            <input type="radio" name="booking" id="b3" value="GetYourGuide" class="radio-btn"><label for="b3" class="radio-label">GetYourGuide</label>
            <input type="radio" name="booking" id="b4" value="Viator" class="radio-btn"><label for="b4" class="radio-label">Viator</label>
            <input type="radio" name="booking" id="b5" value="MyRealTrip" class="radio-btn"><label for="b5" class="radio-label">MyRealTrip</label>
            <input type="radio" name="booking" id="b6" value="TripAdvisor" class="radio-btn"><label for="b6" class="radio-label">TripAdvisor</label>
            <input type="radio" name="booking" id="b7" value="OfficialWeb" class="radio-btn"><label for="b7" class="radio-label" data-i18n="bk_official">Official Website</label>
        </div>
        
        <label class="q-label" data-i18n="q_aware">How did you find us?</label>
        <div class="btn-group">
            <input type="radio" name="aware" id="a6" value="WalkBy" class="radio-btn"><label for="a6" class="radio-label" data-i18n="aw_walk">Walked by</label>
            <input type="radio" name="aware" id="a4" value="GoogleMap" class="radio-btn"><label for="a4" class="radio-label">Google Map</label>
            <input type="radio" name="aware" id="a2" value="BookingSite" class="radio-btn"><label for="a2" class="radio-label" data-i18n="aw_site">Booking Site</label>
            <input type="radio" name="aware" id="a1" value="SNS" class="radio-btn"><label for="a1" class="radio-label">SNS (Insta/TikTok)</label>
            <input type="radio" name="aware" id="a3" value="YouTube" class="radio-btn"><label for="a3" class="radio-label">YouTube</label>
            <input type="radio" name="aware" id="a5" value="Friend" class="radio-btn"><label for="a5" class="radio-label" data-i18n="aw_friend">Friend / Recommendation</label>
        </div>

        <hr class="divider">

        <p class="sub-text" data-i18n="s4_desc">Finally, please leave any comments.</p>
        <textarea id="txt-comment" rows="3" placeholder="Optional"></textarea>

        <div class="nav-btns">
            <button class="btn-main" onclick="finishBottom()" data-i18n="btn_submit">Submit ✅</button>
        </div>
    </div>
</div>

<script>
    // --- 翻訳データ---
    const TRANSLATIONS = {
        en: {
            req_msg: "Complete the survey to see your photos.",
            s1_title: "Step 1/2: Satisfaction Survey", q_guide: "Guide's Performance", q_photo: "Photo Service", q_nps: "Would you recommend us?",
            s2_title: "Step 2/2: About You", q_nation: "Nationality / Region", q_companion: "Who are you with?",
            opt_family: "Family", opt_couple: "Couple", opt_friends: "Friends", opt_solo: "Solo",
            s3_title: "Step 3/4: Booking & Awareness", q_booking: "Booking Channel", bk_walkin: "Walk-in", bk_official: "Official Website",
            q_aware: "How did you find us?", aw_site: "Booking Site", aw_friend: "Recommendation", aw_walk: "Walked by",
            s4_title: "Step 4/4: Message", s4_desc: "Finally, please leave any comments.(optional)",
            btn_next: "Next ➡", btn_back: "⬅ Back", btn_submit: "Submit ✅", ph_comment: "Great tour! etc.",
            done_title: "Thank You!", done_msg: "We appreciate your feedback.<br>Please continue to enjoy your photos.",
            review_request: "If you liked it, please review us on<br><strong>%SITE%</strong>! 🙏"
        },
        ja: {
            req_msg: "※全ての評価を選択してください",
            s1_title: "Step 1/2: 満足度を教えてください", q_guide: "ガイドの楽しさ ", q_photo: "写真サービス ", q_nps: "友人に勧めたいですか？",
            s2_title: "Step 2/2: お客様について", q_nation: "国籍 / 地域", q_companion: "同伴者",
            opt_family: "家族", opt_couple: "カップル・夫婦", opt_friends: "友人", opt_solo: "一人旅",
            s3_title: "Step 3/4: 予約と認知", q_booking: "予約経路", bk_walkin: "当日チケット売場", bk_official: "公式サイト",
            q_aware: "どこで知りましたか？", aw_site: "予約サイト", aw_friend: "知人の紹介", aw_walk: "通りがかり",
            s4_title: "Step 4/4: メッセージ", s4_desc: "最後に、ご感想やスタッフへのメッセージがあればご自由にお書きください。",
            btn_next: "次へ ➡", btn_back: "⬅ 戻る", btn_submit: "送信する ✅", ph_comment: "楽しかった！など",
            done_title: "ありがとうございました！", done_msg: "アンケートへのご協力感謝いたします。<br>引き続き写真をお楽しみください。",
            review_request: "よろしければ、%SITE%で<br>レビューをお願いします！🙏"
        },
        ko: {
            req_msg: "* 모든 항목을 선택해주세요.",
            s1_title: "Step 1/2: 만족도 조사", q_guide: "가이드 평가 ", q_photo: "사진 서비스 ", q_nps: "친구에게 추천하시겠습니까?",
            s2_title: "Step 2/2: 고객 정보", q_nation: "국적 / 지역", q_companion: "동반자",
            opt_family: "가족", opt_couple: "커플", opt_friends: "친구", opt_solo: "혼자",
            s3_title: "Step 3/4: 예약 및 인지 경로", q_booking: "예약 사이트", bk_walkin: "현장 구매", bk_official: "공식 웹사이트",
            q_aware: "어떻게 알게 되셨나요?", aw_site: "예약 사이트", aw_friend: "지인 추천", aw_walk: "지나가다 우연히",
            s4_title: "Step 4/4: 메시지", s4_desc: "마지막으로, 의견이나 스태프에게 전하고 싶은 메시지가 있으면 자유롭게 적어주세요.",
            btn_next: "다음 ➡", btn_back: "⬅ 이전", btn_submit: "보내기 ✅", ph_comment: "즐거웠어요! 등",
            done_title: "감사합니다!", done_msg: "설문에 응해주셔서 감사합니다.<br>계속해서 사진을 즐겨주세요.",
            review_request: "괜찮으시다면 %SITE%에<br>리뷰를 부탁드립니다!🙏"
        },
        zh_tw: {
            req_msg: "* 請選擇所有評分",
            s1_title: "Step 1/2: 滿意度調查", q_guide: "導遊評價 ", q_photo: "攝影服務 ", q_nps: "您會推薦給朋友嗎？",
            s2_title: "Step 2/2: 關於您", q_nation: "國籍 / 地區", q_companion: "同伴",
            opt_family: "家庭", opt_couple: "情侶/夫妻", opt_friends: "朋友", opt_solo: "一人",
            s3_title: "Step 3/4: 預約與認知", q_booking: "預約平台", bk_walkin: "現場購票", bk_official: "官方網站",
            q_aware: "您是如何得知我們的？", aw_site: "預約平台", aw_friend: "親友推薦", aw_walk: "路過",
            s4_title: "Step 4/4: 留言", s4_desc: "最後，歡迎留下感想或給工作人員的訊息。",
            btn_next: "下一步 ➡", btn_back: "⬅ 上一步", btn_submit: "提交 ✅", ph_comment: "很好玩！等等",
            done_title: "謝謝您！", done_msg: "感謝您的回饋。<br>請繼續瀏覽照片。",
            review_request: "如果喜歡，請在 %SITE%<br>留下評價！🙏"
        },
        zh_cn: {
            req_msg: "* 请选择所有评分",
            s1_title: "Step 1/2: 满意度调查", q_guide: "导游评价 ", q_photo: "摄影服务 ", q_nps: "您会推荐给朋友吗？",
            s2_title: "Step 2/2: 关于您", q_nation: "国籍 / 地区", q_companion: "同伴",
            opt_family: "家庭", opt_couple: "情侣/夫妻", opt_friends: "朋友", opt_solo: "一人",
            s3_title: "Step 3/4: 预约与认知", q_booking: "预约平台", bk_walkin: "现场购票", bk_official: "官方网站",
            q_aware: "您是如何得知我们的？", aw_site: "预约平台", aw_friend: "亲友推荐", aw_walk: "路过",
            s4_title: "Step 4/4: 留言", s4_desc: "最后，欢迎留下感想或给工作人员的讯息。",
            btn_next: "下一步 ➡", btn_back: "⬅ 上一步", btn_submit: "提交 ✅", ph_comment: "很好玩！等等",
            done_title: "谢谢您！", done_msg: "感谢您的反馈。<br>请继续浏览照片。",
            review_request: "如果喜欢，请在 %SITE%<br>留下评价！🙏"
        },
        th: {
            req_msg: "* โปรดเลือกทุกข้อ",
            s1_title: "Step 1/2: แบบสอบถามความพึงพอใจ", q_guide: "ความพึงพอใจต่อไกด์ ", q_photo: "บริการถ่ายภาพ ", q_nps: "คุณจะแนะนำเราให้เพื่อนหรือไม่?",
            s2_title: "Step 2/2: เกี่ยวกับคุณ", q_nation: "สัญชาติ / ภูมิภาค", q_companion: "มากับใคร",
            opt_family: "ครอบครัว", opt_couple: "คู่รัก", opt_friends: "เพื่อน", opt_solo: "คนเดียว",
            s3_title: "Step 3/4: การจองและการรับรู้", q_booking: "ช่องทางการจอง", bk_walkin: "ซื้อหน้างาน", bk_official: "เว็บไซต์อย่างเป็นทางการ",
            q_aware: "คุณรู้จักเราได้อย่างไร?", aw_site: "เว็บไซต์จอง", aw_friend: "คนรู้จักแนะนำ", aw_walk: "เดินผ่านมาเจอ",
            s4_title: "Step 4/4: ข้อความ", s4_desc: "สุดท้ายนี้ หากมีข้อเสนอแนะหรือข้อความถึงพนักงาน สามารถเขียนได้เลย",
            btn_next: "ถัดไป ➡", btn_back: "⬅ ย้อนกลับ", btn_submit: "ส่ง ✅", ph_comment: "สนุกมาก! ฯลฯ",
            done_title: "ขอบคุณครับ/ค่ะ!", done_msg: "ขอบคุณสำหรับความคิดเห็น<br>เชิญรับชมรูปภาพต่อได้เลย",
            review_request: "หากชอบ โปรดรีวิวให้เราที่<br>%SITE% ด้วยนะครับ/คะ! 🙏"
        },
        ms: {
            req_msg: "* Sila pilih semua penilaian.",
            s1_title: "Langkah 1/2: Tinjauan Kepuasan", q_guide: "Prestasi Pemandu ", q_photo: "Perkhidmatan Foto ", q_nps: "Adakah anda akan mengesyorkan kami?",
            s2_title: "Langkah 2/2: Tentang Anda", q_nation: "Kewarganegaraan / Wilayah", q_companion: "Dengan siapa anda?",
            opt_family: "Keluarga", opt_couple: "Pasangan", opt_friends: "Rakan", opt_solo: "Solo",
            s3_title: "Langkah 3/4: Tempahan & Maklumat", q_booking: "Saluran Tempahan", bk_walkin: "Walk-in", bk_official: "Laman Web Rasmi",
            q_aware: "Bagaimana anda mengetahui tentang kami?", aw_site: "Laman Tempahan", aw_friend: "Cadangan", aw_walk: "Lalu berhenti",
            s4_title: "Langkah 4/4: Mesej", s4_desc: "Akhir sekali, sila tinggalkan komen.",
            btn_next: "Seterusnya ➡", btn_back: "⬅ Kembali", btn_submit: "Hantar ✅", ph_comment: "Lawatan yang hebat! dll.",
            done_title: "Terima Kasih!", done_msg: "Kami menghargai maklum balas anda.<br>Sila nikmati gambar anda.",
            review_request: "Jika anda suka, sila ulas di<br><strong>%SITE%</strong>! 🙏"
        },
        id: {
            req_msg: "* Harap pilih semua penilaian.",
            s1_title: "Langkah 1/2: Survei Kepuasan", q_guide: "Kinerja Pemandu ", q_photo: "Layanan Foto ", q_nps: "Apakah Anda akan merekomendasikan kami?",
            s2_title: "Langkah 2/2: Tentang Anda", q_nation: "Kebangsaan / Wilayah", q_companion: "Dengan siapa Anda datang?",
            opt_family: "Keluarga", opt_couple: "Pasangan", opt_friends: "Teman", opt_solo: "Sendiri",
            s3_title: "Langkah 3/4: Pemesanan & Informasi", q_booking: "Saluran Pemesanan", bk_walkin: "Walk-in", bk_official: "Situs Resmi",
            q_aware: "Bagaimana Anda mengetahui kami?", aw_site: "Situs Pemesanan", aw_friend: "Rekomendasi", aw_walk: "Lewat dan melihat",
            s4_title: "Langkah 4/4: Pesan", s4_desc: "Terakhir, silakan tinggalkan komentar.",
            btn_next: "Berikutnya ➡", btn_back: "⬅ Kembali", btn_submit: "Kirim ✅", ph_comment: "Tur yang bagus! dll.",
            done_title: "Terima Kasih!", done_msg: "Kami menghargai masukan Anda.<br>Silakan nikmati foto Anda.",
            review_request: "Jika Anda suka, silakan ulas di<br><strong>%SITE%</strong>! 🙏"
        },
        es: {
            req_msg: "* Por favor selecciona todo.",
            s1_title: "Paso 1/2: Encuesta de Satisfacción", q_guide: "Rendimiento del Guía ", q_photo: "Servicio de Fotos ", q_nps: "¿Nos recomendarías?",
            s2_title: "Paso 2/2: Sobre Ti", q_nation: "Nacionalidad / Región", q_companion: "¿Con quién vienes?",
            opt_family: "Familia", opt_couple: "Pareja", opt_friends: "Amigos", opt_solo: "Solo",
            s3_title: "Paso 3/4: Reserva & Información", q_booking: "Canal de Reserva", bk_walkin: "Walk-in", bk_official: "Sitio Oficial",
            q_aware: "¿Cómo nos encontraste?", aw_site: "Sitio de Reservas", aw_friend: "Recomendación", aw_walk: "Pasé por aquí",
            s4_title: "Paso 4/4: Mensaje", s4_desc: "Por último, deja tus comentarios.",
            btn_next: "Siguiente ➡", btn_back: "⬅ Atrás", btn_submit: "Enviar ✅", ph_comment: "¡Gran tour! etc.",
            done_title: "¡Gracias!", done_msg: "Agradecemos tus comentarios.<br>Por favor, disfruta de tus fotos.",
            review_request: "Si te gustó, ¡déjanos una reseña en<br><strong>%SITE%</strong>! 🙏"
        },
        vi: {
            req_msg: "* Vui lòng chọn tất cả.",
            s1_title: "Step 1/2: Khảo sát mức độ hài lòng", q_guide: "Đánh giá hướng dẫn viên ", q_photo: "Dịch vụ chụp ảnh ", q_nps: "Bạn có muốn giới thiệu chúng tôi không?",
            s2_title: "Step 2/2: Về bạn", q_nation: "Quốc tịch / Khu vực", q_companion: "Bạn đi cùng ai",
            opt_family: "Gia đình", opt_couple: "Cặp đôi", opt_friends: "Bạn bè", opt_solo: "Một mình",
            s3_title: "Step 3/4: Đặt chỗ & Nhận biết", q_booking: "Kênh đặt chỗ", bk_walkin: "Mua vé tại chỗ", bk_official: "Trang web chính thức",
            q_aware: "Làm sao bạn biết đến chúng tôi?", aw_site: "Trang web đặt phòng", aw_friend: "Bạn bè giới thiệu", aw_walk: "Tình cờ đi ngang qua",
            s4_title: "Step 4/4: Tin nhắn", s4_desc: "Cuối cùng, xin vui lòng để lại bất kỳ nhận xét hoặc tin nhắn cho nhân viên.",
            btn_next: "Tiếp theo ➡", btn_back: "⬅ Quay lại", btn_submit: "Gửi ✅", ph_comment: "Rất vui! v.v.",
            done_title: "Cảm ơn bạn!", done_msg: "Cảm ơn phản hồi của bạn.<br>Hãy tiếp tục thưởng thức những bức ảnh.",
            review_request: "Nếu bạn thích, vui lòng đánh giá chúng tôi trên<br><strong>%SITE%</strong>! 🙏"
        }
    };

    const COUNTRY_TO_LANG = {
        'Japan': 'ja', 'South Korea': 'ko',
        'Taiwan': 'zh_tw', 'Hong Kong': 'zh_tw', 'China': 'zh_cn',
        'Thailand': 'th', 'Vietnam': 'vi',
        'Mexico': 'es', 'Spain': 'es',
        'Malaysia': 'ms', 'Indonesia': 'id'
    };

    let uid = localStorage.getItem('minato_uid');
    if (!uid) {
        uid = 'u_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        localStorage.setItem('minato_uid', uid);
    }
    let surveyData = { FeedbackId: uid };
    let ratings = { nps: null, guide: null, camera: null };

    // --- サイネージ判定 ---
    const urlParams = new URLSearchParams(window.location.search);
    const isSignage = urlParams.get('mode') === 'signage';

    if (!isSignage) {
        document.getElementById('survey-modal').style.display = 'flex';
        applyTranslation('en'); // 初期言語
        generateNpsButtons();
    } else {
        console.log("Signage Mode: Survey disabled.");
    }

    // --- ロジック系関数 ---
    function generateNpsButtons() {
        const container = document.getElementById('grp-nps');
        for (let i = 0; i <= 10; i++) {
            const btn = document.createElement('div');
            btn.className = 'nps-btn';
            btn.innerText = i;
            btn.onclick = function() { selectNps(i, this); };
            container.appendChild(btn);
        }
        setTimeout(() => { container.scrollLeft = container.scrollWidth; }, 100);
    }

    function selectNps(val, btnElem) {
        ratings.nps = val;
        Array.from(btnElem.parentElement.children).forEach(s => s.classList.remove('selected'));
        btnElem.classList.add('selected');
        checkStep1Validation();
    }

    window.selectStar = function(type, val) {
        ratings[type] = val;
        const container = document.getElementById('grp-' + type);
        const stars = container.getElementsByClassName('star-btn');
        for (let i = 0; i < stars.length; i++) {
            if (i < val) stars[i].classList.add('active');
            else stars[i].classList.remove('active');
        }
        checkStep1Validation();
    }

    function checkStep1Validation() {
        const nextBtn = document.getElementById('btn-step1-next');
        if (ratings.nps !== null && ratings.guide !== null && ratings.camera !== null) {
            nextBtn.disabled = false;
        } else {
            nextBtn.disabled = true;
        }
    }

    function handleNationChange(val) {
        const otherInput = document.getElementById('input-nation-other');
        if (val === 'Other') otherInput.style.display = 'block';
        else otherInput.style.display = 'none';
        
        const lang = COUNTRY_TO_LANG[val] || 'en';
        applyTranslation(lang);
        document.getElementById('btn-step2-finish').disabled = false;
    }

    function applyTranslation(lang) {
        const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if(t[key]) el.innerHTML = t[key];
        });
        document.getElementById('txt-comment').placeholder = t.ph_comment || "Optional";
        
        const reqText = document.getElementById('review-req');
        let site = "Your Booking Site!";
        if(['zh_cn','zh_tw'].includes(lang)) site = "你使用的预订网站";
        if(lang === 'ko') site = "당신이 사용한 예약 사이트";
        if(t.review_request) reqText.innerHTML = t.review_request.replace('%SITE%', site);
    }

    // --- 遷移処理 ---
    function nextModal(currentStep) {
        document.getElementById('modal-step' + currentStep).style.display = 'none';
        document.getElementById('modal-step' + (currentStep + 1)).style.display = 'block';
    }
    function backModal(currentStep) {
        document.getElementById('modal-step' + currentStep).style.display = 'none';
        document.getElementById('modal-step' + (currentStep - 1)).style.display = 'block';
    }

    async function finishModal() {
        // 先行データの保存・送信
        surveyData.ratingNPS = ratings.nps;
        surveyData.ratingGuide = ratings.guide;
        surveyData.ratingCamera = ratings.camera;
        
        const nationSel = document.getElementById('sel-nation');
        let nation = nationSel.value;
        if(nation === 'Other') nation = document.getElementById('input-nation-other').value;
        surveyData.nationality = nation;

        sendData(surveyData); // 途中送信

        document.getElementById('survey-modal').style.display = 'none'; 
        if(!isSignage) document.getElementById('bottom-survey-area').style.display = 'block';
    }

    async function finishBottom() {
        // 残りのデータを取得
        const comp = document.querySelector('input[name="companion"]:checked');
        if(comp) surveyData.companion = comp.value;
        
        const book = document.querySelector('input[name="booking"]:checked');
        if(book) surveyData.booking = book.value;
        
        const aware = document.querySelector('input[name="aware"]:checked');
        if(aware) surveyData.awareness = aware.value;
        
        surveyData.comment = document.getElementById('txt-comment').value;

        await sendData(surveyData); // 全データ送信

        document.getElementById('bottom-form').style.display = 'none';
        document.getElementById('bottom-thanks').style.display = 'block';
        document.getElementById('bottom-thanks').scrollIntoView({behavior:'smooth'});
    }

    async function sendData(data) {
        const payload = { 
            ...data,
            cruiseDate: document.getElementById('cruise-date').value,
            cruiseTime: document.getElementById('cruise-time').value,
            submittedAt: new Date().toISOString()
        };
        try {
            await fetch('${API_URL}', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) { console.error("Send error", e); }
    }
</script>`;


// HTML挿入
    return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css"> 
    <title>${date} - ${cruiseId} Photo Catalog</title>
</head>
<body>
    <div class="header">
        <h1>Thank you for joining our cruise.</h1>
        <p><strong>Please press and hold the photo to save it.</strong></p>
        <div id="timer" class="countdown">Ends in : <span id="timer-time">--:--</span></div>
    </div>
    
    <div id="photo-data" style="display:none;" data-start-time="${startTimeMs}"></div>
    
    <div class="photo-grid">
        ${photoHtml}
    </div>

    <div id="lightbox-modal" class="lightbox-overlay" style="display:none;">
        <span class="lightbox-close">x</span>
        <a class="lightbox-prev">❮</a>
        <div class="lightbox-content">
            <div class="lightbox-image-frame">
                <img id="lightbox-image" src="" alt="Enlarged photo">
            </div>
            <div id="download-hint-box">
                <p data-lang="en">Press and hold to save</p>
                <p data-lang="ja" style="display:none;">Press ande hold to save</p>
            </div>
        </div>
        <a class="lightbox-next">❯</a>
    </div>
    <script src="main.js"></script> 
    ${feedbackScript}
</body>
</html>`;
}

// =======================================================
// メインハンドラ
// =======================================================
export async function handler(event){
    try {
        const requestBody = JSON.parse(event.body); 
        const date = requestBody.date; 
        const cruiseId = requestBody.cruiseId; 
        
        const prefix = `${date}/${cruiseId}/`; 
        const catalogFileName = `${date}-${cruiseId}-catalog.html`;

        console.log(`カタログ生成対象: ${prefix}`);

        const photoList = await getPhotoList(prefix);
        
        if (photoList.length === 0) {
            console.log(`写真が見つかりませんでした。カタログ生成をスキップします: ${prefix}`);
            return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*****', 'Content-Type': 'application/json' }, body: JSON.stringify({ message: "写真なし、カタログスキップ" }) };
        }

        // 3. HTML カタログコンテンツを生成
        const htmlContent = await generateHtmlCatalog(date, cruiseId, photoList);

        // 4. 生成したカタログHTMLを公開用S3バケットにアップロード（アーカイブ用）
        await putContentToS3(catalogFileName, htmlContent, 'text/html');

        // 6. カタログの公開URLを生成
        const catalogUrl = `${CLOUDFRONT_DOMAIN}/${catalogFileName}`;
        // 7. QRコード生成とS3への保存 (qrcode.png) 
        const qrCodeBuffer = await qrcode.toBuffer(catalogUrl, { 
            type: 'png',
            errorCorrectionLevel: 'H',
            scale: 8 
        });
        
        const qrKey = 'qrcode.png';
        await putContentToS3(qrKey, qrCodeBuffer, 'image/png');
        console.log(`QRコードを ${qrKey} に保存しました。`);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*****', 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                message: "カタログ生成成功", 
                url: catalogUrl
            }),
        };

    } catch (error) {
        console.error("致命的なエラーが発生しました:", error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*****', 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: `カタログ生成処理でサーバーエラー: ${error.message}` }),
        };
    }
};