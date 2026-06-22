const storage = require('../../utils/storage.js');

// 安全的回退方法
function safeBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    wx.navigateBack();
  } else {
    wx.reLaunch({ url: '/pages/logs/logs' });
  }
}

const recorderManager = wx.getRecorderManager();

// 预设标签选项
const tagOptions = [
  { key: 'emotion', name: '情绪觉察', icon: 'heart', color: '#ec4899' },
  { key: 'energy', name: '能量记录', icon: 'bolt', color: '#f59e0b' },
  { key: 'gratitude', name: '感恩日记', icon: 'hands', color: '#7c3aed' },
  { key: 'success', name: '成功记录', icon: 'trophy', color: '#f59e0b' },
  { key: 'custom', name: '其他（自定义）', icon: 'plus', color: '#6b7280' }
];

// 标签引导
const tagGuides = {
  emotion: {
    title: '💗 情绪觉察引导',
    tip: '觉察自己的情绪触发点，发掘情绪背后的期待和需求，发现自己的情绪模式',
    placeholder: '今天发生了什么？我有什么感受？这种情绪背后有什么期待...'
  },
  energy: {
    title: '⚡ 能量记录引导',
    tip: '觉察自己的能量起伏，发现滋养和消耗自己能量的事情，作为自我调整的参考',
    placeholder: '今天的能量状态如何？什么事让我充满能量？什么事消耗了我的能量...'
  },
  gratitude: {
    title: '🙏 感恩日记引导',
    tip: '每天发现三个以上的感恩的事或者人，培养自己的关注力',
    placeholder: '今天我想感谢...让我感到温暖和幸福的是...我珍惜...'
  },
  success: {
    title: '🏆 成功记录引导',
    tip: '每天记录自己值得肯定的点，培养自我正反馈和正向关注力',
    placeholder: '今天我做到了...我对自己的表现很满意...我进步的地方是...'
  }
};

Page({
  data: {
    selectedTag: '',
    tagIndex: -1,
    tagOptions: tagOptions,
    customTag: '',
    isCustom: false,
    content: '',
    images: [],
    isSavingImages: false,  // 正在持久化图片中，禁止保存
    isRecording: false,
    isRecognizing: false, // 是否正在语音识别中
    tagGuide: {
      title: '选择日志类型开始记录',
      tip: '请从下拉框中选择一种日志类型，获取相应的记录引导',
      placeholder: '从下拉框中选择日志类型，开始你的觉察之旅...'
    },
    canSave: false
  },

  onLoad() {
    this.initRecorder();
  },

  onUnload() {
    recorderManager.stop();
  },

  initRecorder() {
    // 录音结束回调：自动进行语音识别
    recorderManager.onStop((res) => {
      this.setData({ isRecording: false });
      // 自动进行语音识别
      this.doSpeechRecognition(res.tempFilePath);
    });

    // 录音错误回调
    recorderManager.onError((err) => {
      console.error('录音错误', err);
      this.setData({ isRecording: false });
      wx.showToast({ title: '录音失败，请重试', icon: 'none' });
    });
  },

  onTagChipTap(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    const option = tagOptions[index];
    const isCustom = option.key === 'custom';

    if (isCustom) {
      this.setData({
        tagIndex: index,
        selectedTag: '',
        isCustom: true,
        tagGuide: {
          title: '✏️ 自定义日志类型',
          tip: '请输入你的自定义日志类型名称，然后自由记录内容',
          placeholder: '写下你的所思所想...'
        },
        canSave: false
      });
    } else {
      const guide = tagGuides[option.key];
      this.setData({
        tagIndex: index,
        selectedTag: option.key,
        isCustom: false,
        customTag: '',
        tagGuide: guide
      });
      this.checkCanSave();
    }
  },

  onCustomTagInput(e) {
    this.setData({ customTag: e.detail.value.trim() });
    this.checkCanSave();
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
    this.checkCanSave();
  },

  checkCanSave() {
    const hasContent = this.data.content.trim().length > 0;
    let canSave = false;
    if (this.data.isCustom) {
      canSave = this.data.customTag.length > 0 && hasContent;
    } else {
      canSave = !!this.data.selectedTag && hasContent;
    }
    this.setData({ canSave });
  },

  toggleRecord() {
    if (this.data.isRecording) {
      recorderManager.stop();
    } else {
      this.setData({ isRecording: true });
      recorderManager.start({
        duration: 60000,
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitRate: 48000,
        format: 'mp3'
      });
    }
  },

  // 语音识别：将录音文件转为文字
  doSpeechRecognition(filePath) {
    if (!wx.cloud) {
      console.warn('⚠️ wx.cloud 不可用，云开发未初始化，语音识别跳过');
      wx.showToast({ title: '云开发未初始化', icon: 'none' });
      return;
    }

    console.log('🎤 开始语音识别，文件路径:', filePath);
    this.setData({ isRecognizing: true });

    const fs = wx.getFileSystemManager();
    fs.readFile({
      filePath,
      encoding: 'base64',
      success: (res) => {
        const dataLength = res.data ? res.data.length : 0;
        console.log('📦 音频数据大小 (base64):', dataLength, 'bytes');

        // 如果 base64 数据过小（< 100 字节），说明音频文件内容无效（开发者工具限制）
        if (dataLength < 100) {
          console.warn('⚠️ 音频数据过小，开发者工具中录音格式与真机不同，请用真机测试');
          this.setData({ isRecognizing: false });
          wx.showModal({
            title: '提示',
            content: '开发者工具中录音格式与真机不同，语音识别功能请在真机上测试',
            showCancel: false,
            confirmText: '知道了'
          });
          return;
        }

        wx.cloud.callFunction({
          name: 'speechToText',
          data: { audioBase64: res.data },
          success: (result) => {
            this.setData({ isRecognizing: false });
            const text = result.result && result.result.text;
            if (text && text.trim()) {
              // 将识别结果追加到内容中
              const newContent = this.data.content 
                ? this.data.content + '\n' + text.trim()
                : text.trim();
              this.setData({ content: newContent });
              this.checkCanSave();
              wx.showToast({ title: '已识别为文字', icon: 'success' });
            } else if (result.result && result.result.errMsg) {
              console.warn('语音识别失败:', result.result.errMsg);
              wx.showToast({ title: '识别失败，请用真机测试', icon: 'none' });
            }
          },
          fail: (err) => {
            console.error('语音识别云函数调用失败:', err);
            this.setData({ isRecognizing: false });
            wx.showToast({ title: '云函数调用失败', icon: 'none' });
          }
        });
      },
      fail: (err) => {
        console.error('读取录音文件失败:', err);
        this.setData({ isRecognizing: false });
      }
    });
  },

  chooseImage() {
    const count = 9 - this.data.images.length;
    wx.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPaths = res.tempFilePaths || [];
        if (tempPaths.length === 0) return;

        // 进入持久化状态，禁止保存
        this.setData({ isSavingImages: true });
        wx.showLoading({ title: '保存图片中...', mask: true });

        let completed = 0;
        let resolved = false;
        const pathMap = {}; // tempPath -> savedPath
        const total = tempPaths.length;

        // 超时保护：15 秒后强制结束，避免卡死
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            console.warn('图片持久化超时，使用临时路径');
            tempPaths.forEach(p => { if (!pathMap[p]) pathMap[p] = p; });
            this.onImagesPersisted(pathMap);
          }
        }, 15000);

        const checkAllDone = () => {
          if (!resolved && completed === total) {
            resolved = true;
            clearTimeout(timeout);
            this.onImagesPersisted(pathMap);
          }
        };

        tempPaths.forEach((tempPath) => {
          wx.saveFile({
            tempFilePath: tempPath,
            success: (saveRes) => {
              pathMap[tempPath] = saveRes.savedFilePath;
              completed++;
              checkAllDone();
            },
            fail: (err) => {
              console.warn('持久化图片失败:', err);
              pathMap[tempPath] = tempPath; // fallback
              completed++;
              checkAllDone();
            }
          });
        });
      }
    });
  },

  // 所有图片持久化完成后调用
  onImagesPersisted(pathMap) {
    const persistedPaths = Object.values(pathMap);
    const newImages = [...this.data.images, ...persistedPaths];

    this.setData({
      images: newImages,
      isSavingImages: false
    });
    wx.hideLoading();
    wx.showToast({ title: `已添加 ${persistedPaths.length} 张图片`, icon: 'success' });
    this.checkCanSave();
  },

  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const imagePath = this.data.images[index];
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images });

    // 删除持久化图片文件
    if (imagePath && imagePath.startsWith(wx.env.USER_DATA_PATH)) {
      const fs = wx.getFileSystemManager();
      fs.unlink({
        filePath: imagePath,
        success: () => console.log('删除图片文件:', imagePath),
        fail: (err) => console.warn('删除图片文件失败:', err)
      });
    }
  },

  goBack() {
    if (this.data.content || this.data.images.length > 0) {
      wx.showModal({
        title: '确认离开',
        content: '日志尚未保存，确定要离开吗？',
        confirmColor: '#8b5cf6',
        success: (res) => {
          if (res.confirm) {
            safeBack();
          }
        }
      });
    } else {
      safeBack();
    }
  },

  saveLog() {
    if (this.data.isSavingImages) {
      wx.showToast({ title: '图片保存中，请稍候', icon: 'none' });
      return;
    }

    if (!this.data.canSave) {
      wx.showToast({
        title: '请选择类型并填写内容',
        icon: 'none'
      });
      return;
    }

    const tag = this.data.isCustom ? this.data.customTag : this.data.selectedTag;
    
    const log = {
      tag: tag,
      content: this.data.content.trim(),
      images: this.data.images
    };

    storage.addLog(log);

    wx.showToast({
      title: '日志保存成功',
      icon: 'success',
      duration: 1500
    });

    setTimeout(() => {
      safeBack();
    }, 1500);
  }
});
