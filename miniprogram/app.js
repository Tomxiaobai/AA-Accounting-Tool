const { init } = require("./libs/wxCloudClientSDK.umd.js");

App({
  globalData: {
    userId: '',
    userName: '',
    models: null
  },

  onLaunch() {
    wx.cloud.init({
      env: 'cloud1-1gnkqc545e936e74'
    });

    var client = init(wx.cloud);
    this.globalData.models = client.models;

    // 从本地缓存读取用户信息
    var userId = wx.getStorageSync('userId');
    var userName = wx.getStorageSync('userName');
    if (userId && userName) {
      this.globalData.userId = userId;
      this.globalData.userName = userName;
    }

    console.log('AA记账小程序启动 - 云开发模式');
  },

  // 设置用户信息并缓存
  setUserInfo(userId, userName) {
    this.globalData.userId = userId;
    this.globalData.userName = userName;
    wx.setStorageSync('userId', userId);
    wx.setStorageSync('userName', userName);
  },

  // 是否已登录
  isLoggedIn() {
    return !!this.globalData.userId && !!this.globalData.userName;
  }
});
