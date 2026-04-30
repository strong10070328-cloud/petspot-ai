// Netlify Function: Feishu Bitable Write
// Called from frontend via fetch('/.netlify/functions/feishu-write', {method:'POST', body: JSON.stringify({email})})
const APP_ID = 'cli_a871f736edb1d00b';
const APP_SECRET = '2dp1vvVWOT211EbfG5O7vfnayBdk8Ty1';
const BASE_TOKEN = 'Pzv8bP9C0a536fsVe3FctZWqnld';
const TABLE_ID = 'tblq8sKyGyct351C';

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let email;
  try {
    const body = JSON.parse(event.body);
    email = body.email;
  } catch (e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  if (!email) {
    return { statusCode: 400, body: 'Missing email' };
  }

  try {
    // Get access token
    const tokenResp = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET })
    });
    const tokenData = await tokenResp.json();
    const token = tokenData.tenant_access_token;

    // Get today's date as ms timestamp (00:00:00 UTC+8)
    const now = new Date();
    const beijingOffset = 8 * 60 * 60 * 1000;
    const todayStart = new Date(now.getTime() + beijingOffset);
    todayStart.setUTCHours(0, 0, 0, 0);
    const ts = todayStart.getTime() - beijingOffset;

    // Write to Feishu Bitable
    const writeResp = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${TABLE_ID}/records`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            '邮箱地址': email,
            '提交日期': ts,
            '是否回复': '未回复'
          }
        })
      }
    );
    const writeData = await writeResp.json();

    if (writeData.code !== 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Feishu API error', detail: writeData })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, record_id: writeData.data?.record?.record_id })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
