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
    // 折叠
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
    userId: '',
    // 滑动操作
    swipedBillId: '',
    // 批量操作
    batchMode: false,
    selectedIds: {},
    selectedCount: 0,
    batchHideLabel: '隐藏',
    // 隐藏账单
    hiddenBillIds: [],
    showHidden: false
  },

  onShow() {
    var app = getApp();
    var loggedIn = app.isLoggedIn();
    var savedCount = wx.getStorageSync('displayCount');
    var hiddenIds = wx.getStorageSync('hiddenBillIds') || [];
    this.setData({
      isLoggedIn: loggedIn,
      userName: app.globalData.userName,
      userId: app.globalData.userId,
      displayCount: savedCount || 5,
      hiddenBillIds: hiddenIds,
      // 每次进入重置操作状态
      batchMode: false,
      selectedIds: {},
      selectedCount: 0,
      swipedBillId: ''
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
      var res = await api.getBills();
      var items = res.items || [];
      // 按更新时间倒排
      items.sort(function (a, b) {
        var ta = new Date(b.updatedAt || b.createdAt || 0).getTime() || 0;
        var tb = new Date(a.updatedAt || a.createdAt || 0).getTime() || 0;
        return ta - tb;
      });
      this.setData({ allBills: items, loading: false });
      this.applyFilter();
    } catch (err) {
      console.error('加载账单失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  // ========== 搜索与筛选 ==========

  applyFilter() {
    var allBills = this.data.allBills;
    var key = this.data.searchKey.trim().toLowerCase();
    var hiddenSet = {};
    var hiddenIds = this.data.hiddenBillIds;
    for (var h = 0; h < hiddenIds.length; h++) {
      hiddenSet[hiddenIds[h]] = true;
    }

    var filtered = [];
    for (var i = 0; i < allBills.length; i++) {
      var bill = allBills[i];
      var isHidden = hiddenSet[bill.id] || hiddenSet[bill._id];
      if (isHidden && !this.data.showHidden) continue;
      // 标记隐藏状态供模板使用
      bill._hidden = !!isHidden;
      if (key && (bill.name || '').toLowerCase().indexOf(key) === -1) continue;
      filtered.push(bill);
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

  // ========== 展示条数设置 ==========

  openDisplayCountPicker() {
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

  // ========== 滑动操作 ==========

  onTouchStart(e) {
    if (this.data.batchMode) return;
    this._touchStartX = e.touches[0].clientX;
    this._touchStartY = e.touches[0].clientY;
    this._swiping = false;
  },

  onTouchMove(e) {
    if (this.data.batchMode) return;
    var dx = e.touches[0].clientX - this._touchStartX;
    var dy = e.touches[0].clientY - this._touchStartY;
    // 水平滑动距离大于垂直距离才算滑动
    if (!this._swiping && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
      this._swiping = true;
    }
  },

  onTouchEnd(e) {
    if (this.data.batchMode) return;
    var endX = e.changedTouches[0].clientX;
    var dx = endX - this._touchStartX;

    if (this._swiping && dx < -60) {
      // 左滑 → 展开操作按钮
      var id = e.currentTarget.dataset.id;
      this.setData({ swipedBillId: id });
    } else if (this._swiping && dx > 60) {
      // 右滑 → 收起
      this.setData({ swipedBillId: '' });
    }
    this._swiping = false;
  },

  closeSwipe() {
    this.setData({ swipedBillId: '' });
  },

  // ========== 隐藏账单 ==========

  hideBill(e) {
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.name;
    var hiddenIds = this.data.hiddenBillIds.slice();
    if (hiddenIds.indexOf(id) === -1) {
      hiddenIds.push(id);
    }
    wx.setStorageSync('hiddenBillIds', hiddenIds);
    this.setData({ hiddenBillIds: hiddenIds, swipedBillId: '' });
    this.applyFilter();
    wx.showToast({ title: '已隐藏「' + name + '」', icon: 'none' });
  },

  unhideBill(e) {
    var id = e.currentTarget.dataset.id;
    var hiddenIds = this.data.hiddenBillIds.filter(function (hid) { return hid !== id; });
    wx.setStorageSync('hiddenBillIds', hiddenIds);
    this.setData({ hiddenBillIds: hiddenIds });
    this.applyFilter();
    wx.showToast({ title: '已取消隐藏', icon: 'none' });
  },

  toggleShowHidden() {
    this.setData({ showHidden: !this.data.showHidden, showAll: false });
    this.applyFilter();
  },

  // ========== 批量操作 ==========

  toggleBatchMode() {
    var entering = !this.data.batchMode;
    this.setData({
      batchMode: entering,
      selectedIds: {},
      selectedCount: 0,
      swipedBillId: ''
    });
  },

  toggleSelectBill(e) {
    var id = e.currentTarget.dataset.id;
    var selectedIds = Object.assign({}, this.data.selectedIds);
    if (selectedIds[id]) {
      delete selectedIds[id];
    } else {
      selectedIds[id] = true;
    }
    var count = Object.keys(selectedIds).length;
    this.setData({ selectedIds: selectedIds, selectedCount: count });
    this._updateBatchHideLabel();
  },

  selectAllBills() {
    var display = this.data.displayBills;
    var currentSelected = this.data.selectedIds;
    var allSelected = display.length > 0;

    for (var i = 0; i < display.length; i++) {
      if (!currentSelected[display[i].id]) {
        allSelected = false;
        break;
      }
    }

    if (allSelected) {
      this.setData({ selectedIds: {}, selectedCount: 0 });
    } else {
      var selectedIds = {};
      for (var i = 0; i < display.length; i++) {
        selectedIds[display[i].id] = true;
      }
      this.setData({ selectedIds: selectedIds, selectedCount: display.length });
    }
    this._updateBatchHideLabel();
  },

  _updateBatchHideLabel() {
    var label = this._allSelectedHidden() ? '取消隐藏' : '隐藏';
    this.setData({ batchHideLabel: label });
  },

  batchDeleteBills() {
    var selectedIds = this.data.selectedIds;
    var ids = Object.keys(selectedIds);
    if (ids.length === 0) {
      wx.showToast({ title: '请先选择账单', icon: 'none' });
      return;
    }

    var that = this;
    wx.showModal({
      title: '批量删除',
      content: '确定删除选中的 ' + ids.length + ' 个账单吗？数据不可恢复。',
      confirmColor: '#ff3b30',
      success: function (res) {
        if (res.confirm) {
          that.doBatchDelete(ids);
        }
      }
    });
  },

  async doBatchDelete(ids) {
    wx.showLoading({ title: '删除中...' });
    var failCount = 0;
    // 并行删除
    var tasks = ids.map(function (id) {
      return api.deleteBill(id).catch(function () { failCount++; });
    });
    await Promise.all(tasks);
    wx.hideLoading();

    if (failCount > 0) {
      wx.showToast({ title: failCount + '个删除失败', icon: 'none' });
    } else {
      wx.showToast({ title: '已删除 ' + ids.length + ' 个', icon: 'success' });
    }
    this.setData({ batchMode: false, selectedIds: {}, selectedCount: 0 });
    this.loadBills();
  },

  // 判断选中的账单是否全部已隐藏
  _allSelectedHidden() {
    var ids = Object.keys(this.data.selectedIds);
    if (ids.length === 0) return false;
    var hiddenSet = {};
    var hiddenIds = this.data.hiddenBillIds;
    for (var h = 0; h < hiddenIds.length; h++) hiddenSet[hiddenIds[h]] = true;
    for (var i = 0; i < ids.length; i++) {
      if (!hiddenSet[ids[i]]) return false;
    }
    return true;
  },

  batchToggleHide() {
    var selectedIds = this.data.selectedIds;
    var ids = Object.keys(selectedIds);
    if (ids.length === 0) {
      wx.showToast({ title: '请先选择账单', icon: 'none' });
      return;
    }

    var hiddenIds = this.data.hiddenBillIds.slice();
    var allHidden = this._allSelectedHidden();
    var msg = '';

    if (allHidden) {
      // 取消隐藏
      var removeSet = {};
      for (var i = 0; i < ids.length; i++) removeSet[ids[i]] = true;
      hiddenIds = hiddenIds.filter(function (hid) { return !removeSet[hid]; });
      msg = '已取消隐藏 ' + ids.length + ' 个账单';
    } else {
      // 隐藏
      for (var i = 0; i < ids.length; i++) {
        if (hiddenIds.indexOf(ids[i]) === -1) {
          hiddenIds.push(ids[i]);
        }
      }
      msg = '已隐藏 ' + ids.length + ' 个账单';
    }

    wx.setStorageSync('hiddenBillIds', hiddenIds);
    this.setData({
      hiddenBillIds: hiddenIds,
      batchMode: false,
      selectedIds: {},
      selectedCount: 0
    });
    this.applyFilter();
    wx.showToast({ title: msg, icon: 'none' });
  },

  // ========== 下拉刷新 ==========

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
    var name = this.data.newBillName.trim();
    if (!name) {
      wx.showToast({ title: '请输入账单名称', icon: 'none' });
      return;
    }
    try {
      this.setData({ creating: true });
      var newBill = await api.createBill(name);
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
    if (this.data.batchMode || this._swiping) return;
    if (this.data.swipedBillId) {
      this.setData({ swipedBillId: '' });
      return;
    }
    var id = e.currentTarget.dataset.id;
    // 已隐藏的账单点击时询问是否取消隐藏，不直接进入详情
    if (this.data.hiddenBillIds.indexOf(id) !== -1) {
      var that = this;
      wx.showModal({
        title: '该账单已隐藏',
        content: '取消隐藏后可正常查看，是否取消隐藏？',
        confirmText: '取消隐藏',
        success: function (res) {
          if (res.confirm) {
            var hiddenIds = that.data.hiddenBillIds.filter(function (hid) { return hid !== id; });
            wx.setStorageSync('hiddenBillIds', hiddenIds);
            that.setData({ hiddenBillIds: hiddenIds });
            that.applyFilter();
            wx.showToast({ title: '已取消隐藏', icon: 'success' });
          }
        }
      });
      return;
    }
    wx.navigateTo({ url: '/pages/bill-detail/bill-detail?id=' + id });
  },

  // 滑动菜单中的删除
  handleSwipeDelete(e) {
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
      content: '确定删除「' + name + '」吗？所有数据不可恢复。',
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
      this.setData({ swipedBillId: '' });
      this.loadBills();
    } catch (err) {
      wx.hideLoading();
      console.error('删除账单失败:', err);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  formatAmount: function (amount) { return formatAmount(amount); },
  formatDate: function (dateStr) { return formatDate(dateStr); }
});
