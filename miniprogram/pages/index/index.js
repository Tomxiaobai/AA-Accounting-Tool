const api = require('../../utils/api');
const { formatAmount, formatDate } = require('../../utils/util');

Page({
  data: {
    bills: [],
    loading: true,
    showCreateDialog: false,
    newBillName: '',
    creating: false,
    // 登录
    showLoginDialog: false,
    loginName: '',
    isLoggedIn: false,
    userName: '',
    userId: ''
  },

  onShow() {
    var app = getApp();
    var loggedIn = app.isLoggedIn();
    this.setData({
      isLoggedIn: loggedIn,
      userName: app.globalData.userName,
      userId: app.globalData.userId
    });

    if (loggedIn) {
      this.loadBills();
    } else {
      this.setData({ loading: false, showLoginDialog: true });
    }
  },

  async loadBills() {
    try {
      this.setData({ loading: true });
      const res = await api.getBills();
      this.setData({ bills: res.items, loading: false });
    } catch (err) {
      console.error('加载账单失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  onPullDownRefresh() {
    this.loadBills().then(function () { wx.stopPullDownRefresh(); });
  },

  // ========== 登录 ==========

  openLoginDialog() {
    this.setData({ showLoginDialog: true });
  },

  onLoginNameInput(e) {
    this.setData({ loginName: e.detail.value });
  },

  onLoginNameBlur(e) {
    // type="nickname" 选择微信昵称后通过 blur 事件回写
    if (e.detail.value) {
      this.setData({ loginName: e.detail.value });
    }
  },

  handleLogin() {
    var name = this.data.loginName.trim();
    if (!name) {
      wx.showToast({ title: '请输入你的昵称', icon: 'none' });
      return;
    }
    var app = getApp();
    var userId = 'user_' + Date.now();
    app.setUserInfo(userId, name);
    this.setData({
      showLoginDialog: false,
      isLoggedIn: true,
      userName: name,
      userId: userId,
      loginName: ''
    });
    this.loadBills();
  },

  // 退出登录
  handleLogout() {
    var that = this;
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      success: function (res) {
        if (res.confirm) {
          var app = getApp();
          app.setUserInfo('', '');
          that.setData({
            isLoggedIn: false,
            userName: '',
            userId: '',
            bills: [],
            showLoginDialog: true
          });
        }
      }
    });
  },

  // ========== 账单操作 ==========

  showCreateDialog() {
    this.setData({ showCreateDialog: true, newBillName: '' });
  },

  hideCreateDialog() {
    this.setData({ showCreateDialog: false, newBillName: '' });
  },

  onBillNameInput(e) {
    this.setData({ newBillName: e.detail.value });
  },

  async handleCreateBill() {
    const name = this.data.newBillName.trim();
    if (!name) {
      wx.showToast({ title: '请输入账单名称', icon: 'none' });
      return;
    }

    try {
      this.setData({ creating: true });
      const newBill = await api.createBill(name);
      wx.showToast({ title: '创建成功', icon: 'success' });
      this.setData({ showCreateDialog: false, creating: false, newBillName: '' });
      wx.navigateTo({ url: '/pages/bill-detail/bill-detail?id=' + newBill.id });
    } catch (err) {
      console.error('创建账单失败:', err);
      wx.showToast({ title: '创建失败', icon: 'none' });
      this.setData({ creating: false });
    }
  },

  goToBillDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/bill-detail/bill-detail?id=' + id });
  },

  // 长按删除账单（仅创建者可操作）
  handleDeleteBill(e) {
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.name;
    var creator = e.currentTarget.dataset.creator;
    var app = getApp();

    if (creator !== app.globalData.userId) {
      wx.showToast({ title: '仅创建者可删除账单', icon: 'none' });
      return;
    }

    var that = this;
    wx.showModal({
      title: '删除账单',
      content: '确定删除「' + name + '」吗？所有消费记录和成员都将被删除，不可恢复。',
      confirmColor: '#ff3b30',
      success: function (res) {
        if (res.confirm) {
          that.doDeleteBill(id);
        }
      }
    });
  },

  async doDeleteBill(id) {
    try {
      wx.showLoading({ title: '删除中...' });
      await api.deleteBill(id);
      wx.hideLoading();
      wx.showToast({ title: '已删除', icon: 'success' });
      this.loadBills();
    } catch (err) {
      wx.hideLoading();
      console.error('删除账单失败:', err);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  formatAmount(amount) {
    return formatAmount(amount);
  },

  formatDate(dateStr) {
    return formatDate(dateStr);
  }
});
