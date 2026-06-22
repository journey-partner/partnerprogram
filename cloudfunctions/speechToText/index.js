const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 腾讯云 ASR 语音识别
const AsrClient = require('tencentcloud-sdk-nodejs-asr').asr.v20190614.Client;

/**
 * 语音识别云函数
 * 将 base64 编码的音频数据转为文字
 * 
 * 参数:
 *  - audioBase64: base64 编码的音频数据（mp3 格式）
 * 
 * 返回:
 *  - text: 识别出的文字
 */
exports.main = async (event) => {
  const { audioBase64 } = event;

  if (!audioBase64) {
    return { text: '', errMsg: '缺少音频数据' };
  }

  // 需要在云函数环境变量中配置 SECRET_ID 和 SECRET_KEY
  // 前往 腾讯云控制台 > 访问管理 > API密钥管理 获取
  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;

  if (!secretId || !secretKey) {
    return { 
      text: '', 
      errMsg: '请先在云函数环境变量中配置 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY' 
    };
  }

  try {
    const client = new AsrClient({
      credential: {
        secretId,
        secretKey
      },
      region: 'ap-guangzhou',
      profile: {
        httpProfile: {
          endpoint: 'asr.tencentcloudapi.com'
        }
      }
    });

    // 计算音频数据长度
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    const params = {
      // 引擎类型：16k_zh 中文普通话
      EngSerViceType: '16k_zh',
      // 语音数据来源：1 = 语音数据（body 中的 Data 字段）
      SourceType: 1,
      // 音频格式
      VoiceFormat: 'mp3',
      // base64 编码的音频数据
      Data: audioBase64,
      // 音频数据长度（字节）
      DataLen: audioBuffer.length
    };

    const result = await client.SentenceRecognition(params);
    return { text: result.Result || '' };

  } catch (err) {
    console.error('语音识别失败:', err);
    return { text: '', errMsg: err.message || '识别失败' };
  }
};
