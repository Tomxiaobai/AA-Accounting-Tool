const api = require('../../utils/api');
const { formatAmount, formatDate } = require('../../utils/util');

Page({
  data: {
    allBills: [],
    displayBills: [],
    loading: true,
    showCreateDialog: false,
    newBillName: '',
    creating: false,
    // 搜索
    searchKey: '',
    // 折叠（默认展示条数，用户可自定义）
    showAll: false,
    hasMore: false,
    filteredCount: 0,
    displayCount: 5,
    displayCountOptions: [3, 5, 10, 15, 20],
    showDisplayCountPicker: false,
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
    // 读取用户自定义的展示条数
    var savedCount = wx.getStorageSync('displayCount');
    this.setData({
      isLoggedIn: loggedIn,
      userName: app.globalData.userName,
      userId: app.globalData.userId,
      displayCount: savedCount || 5
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
      // 按更新时间倒排（最近更新的排最前）
      var items = res.items || [];
      items.sort(function (a, b) {
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      });
      this.setData({ allBills: items, loading: false });
      this.applyFilter();
    } catch (err) {
      console.error('加载账单失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  // 搜索与折叠筛选
  applyFilter() {
    var allBills = this.data.allBills;
    var key = this.data.searchKey.trim().toLowerCase();
    var filtered = allBills;
    if (key) {
      filtered = [];
      for (var i = 0; i < allBills.length; i++) {
        if ((allBills[i].name || '').toLowerCase().indexOf(key) !== -1) {
          filtered.push(allBills[i]);
        }
      }
    }
    var count = this.data.displayCount;
    var hasMore = filtered.length > count;
    var display = this.data.showAll ? filtered : filtered.slice(0, count);
    this.setData({ displayBills: display, hasMore: hasMore, filteredCount: filtered.length });
  },

  onSearchInput(e) {
    this.setData({ searchKey: e.detail.value, showAll: false });
    this.applyFilter();
  },

  clearSearch() {
    this.setData({ searchKey: '', showAll: false });
    this.applyFilter();
  },

  toggleShowAll() {
    this.setData({ showAll: !this.data.showAll });
    this.applyFilter();
  },

  // 展示条数设置
  showDisplayCountPicker() {
    this.setData({ showDisplayCountPicker: true });
  },

  hideDisplayCountPicker() {
    this.setData({ showDisplayCountPicker: false });
  },

  selectDisplayCount(e) {
    var count = Number(e.currentTarget.dataset.count);
    wx.setStorageSync('displayCount', count);
    this.setData({ displayCount: count, showAll: false, showDisplayCountPicker: false });
    this.applyFilter();
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
            allBills: [],
            displayBills: [],
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
