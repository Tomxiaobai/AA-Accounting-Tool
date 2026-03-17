const api = require('../../utils/api');
const { formatAmount, formatDate, getCategoryEmoji } = require('../../utils/util');

Page({
  data: {
    billId: '',
    bill: null,
    expenses: [],
    members: [],
    loading: true,
    activeTab: 'expenses',
    isCreator: false,
    // 结算
    showSettlement: false,
    settlementData: null,
    settlementLoading: false,
    // 添加成员
    showAddMember: false,
    newMemberName: '',
    addingMember: false,
    // 标记是否已自动加入
    _joined: false,
    // 登录
    isLoggedIn: false,
    showLoginDialog: false,
    loginName: '',
    // 导出
    exporting: false
  },

  onLoad(options) {
    this.setData({ billId: options.id });
  },

  async onShow() {
    if (!this.data.billId) return;

    var app = getApp();
    var loggedIn = app.isLoggedIn();
    this.setData({ isLoggedIn: loggedIn });

    if (!loggedIn) {
      this.setData({ loading: false, showLoginDialog: true });
      return;
    }

    // 首次进入时自动加入账单，等待完成后再加载数据
    if (!this.data._joined) {
      this.data._joined = true;
      try {
        await api.joinBill(this.data.billId);
      } catch (err) {
        console.error('加入账单失败:', err);
      }
    }

    this.loadBillData();
  },

  async loadBillData() {
    const { billId } = this.data;
    try {
      this.setData({ loading: true });
      const [bill, expensesRes, membersRes] = await Promise.all([
        api.getBillDetail(billId),
        api.getBillExpenses(billId),
        api.getBillMembers(billId)
      ]);
      var app = getApp();
      var isCreator = bill && bill.creator === app.globalData.userId;
      this.setData({
        bill: bill,
        expenses: expensesRes.items,
        members: membersRes.items,
        loading: false,
        isCreator: isCreator
      });
      if (bill && bill.name) {
        wx.setNavigationBarTitle({ title: bill.name });
      }
    } catch (err) {
      console.error('加载账单数据失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  goAddExpense() {
    wx.navigateTo({
      url: '/pages/add-expense/add-expense?billId=' + this.data.billId
    });
  },

  goStatistics() {
    wx.navigateTo({
      url: '/pages/statistics/statistics?id=' + this.data.billId
    });
  },

  // 删除账单（仅创建者可操作）
  handleDeleteBill() {
    if (!this.data.isCreator) {
      wx.showToast({ title: '仅创建者可删除账单', icon: 'none' });
      return;
    }
    var that = this;
    var bill = this.data.bill || {};
    wx.showModal({
      title: '删除账单',
      content: '确定删除「' + (bill.name || '') + '」吗？所有数据将不可恢复。',
      confirmColor: '#ff3b30',
      success: function (res) {
        if (res.confirm) {
          that.doDeleteBill();
        }
      }
    });
  },

  async doDeleteBill() {
    try {
      wx.showLoading({ title: '删除中...' });
      await api.deleteBill(this.data.billId);
      wx.hideLoading();
      wx.showToast({ title: '已删除', icon: 'success' });
      setTimeout(function () { wx.navigateBack(); }, 500);
    } catch (err) {
      wx.hideLoading();
      console.error('删除账单失败:', err);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  // 删除单条消费
  handleDeleteExpense(e) {
    var expenseId = e.currentTarget.dataset.id;
    var category = e.currentTarget.dataset.category || '消费';
    var amount = e.currentTarget.dataset.amount || '';
    var that = this;
    wx.showModal({
      title: '删除消费',
      content: '确定删除这笔' + category + '（¥' + amount + '）吗？',
      confirmColor: '#ff3b30',
      success: function (res) {
        if (res.confirm) {
          that.doDeleteExpense(expenseId);
        }
      }
    });
  },

  async doDeleteExpense(expenseId) {
    try {
      wx.showLoading({ title: '删除中...' });
      await api.deleteExpense(expenseId);
      wx.hideLoading();
      wx.showToast({ title: '已删除', icon: 'success' });
      this.loadBillData();
    } catch (err) {
      wx.hideLoading();
      console.error('删除消费失败:', err);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  // 结算
  async loadSettlement() {
    try {
      this.setData({ settlementLoading: true });
      const data = await api.getSettlement(this.data.billId);
      this.setData({
        settlementData: data,
        showSettlement: true,
        settlementLoading: false
      });
    } catch (err) {
      console.error('加载结算数据失败:', err);
      wx.showToast({ title: '加载结算失败', icon: 'none' });
      this.setData({ settlementLoading: false });
    }
  },

  hideSettlement() {
    this.setData({ showSettlement: false });
  },

  // 添加成员
  showAddMemberDialog() {
    this.setData({ showAddMember: true, newMemberName: '' });
  },

  hideAddMember() {
    this.setData({ showAddMember: false, newMemberName: '' });
  },

  onMemberNameInput(e) {
    this.setData({ newMemberName: e.detail.value });
  },

  async handleAddMember() {
    var name = this.data.newMemberName.trim();
    if (!name) {
      wx.showToast({ title: '请输入成员昵称', icon: 'none' });
      return;
    }
    try {
      this.setData({ addingMember: true });
      await api.addMember(this.data.billId, name);
      wx.showToast({ title: '添加成功', icon: 'success' });
      this.setData({ showAddMember: false, addingMember: false, newMemberName: '' });
      this.loadBillData();
    } catch (err) {
      wx.showToast({ title: '添加失败', icon: 'none' });
      this.setData({ addingMember: false });
    }
  },

  // ========== 导出为图片 ==========

  handleExport() {
    if (this.data.exporting) return;
    var that = this;
    var bill = this.data.bill;
    var expenses = this.data.expenses;
    var members = this.data.members;
    if (!bill) {
      wx.showToast({ title: '账单数据未加载', icon: 'none' });
      return;
    }

    this.setData({ exporting: true });
    wx.showLoading({ title: '生成图片中...' });

    var query = wx.createSelectorQuery();
    query.select('#export-canvas').fields({ node: true, size: true }).exec(function (res) {
      if (!res || !res[0]) {
        wx.hideLoading();
        wx.showToast({ title: '导出失败', icon: 'none' });
        that.setData({ exporting: false });
        return;
      }

      var canvas = res[0].node;
      var ctx = canvas.getContext('2d');
      var sysInfo = wx.getSystemInfoSync();
      var dpr = sysInfo.pixelRatio || 2;

      var W = 600;
      var PAD = 36;
      var contentW = W - PAD * 2;

      // 计算动态高度
      var totalH = 60 + 40 + 28 + 36 + 80 + 24;
      if (expenses.length > 0) {
        totalH += 30 + 20 + expenses.length * 44 + 20;
      }
      if (members.length > 0) {
        totalH += 30 + 20 + members.length * 44 + 20;
      }
      totalH += 50 + 36;

      canvas.width = W * dpr;
      canvas.height = totalH * dpr;
      ctx.scale(dpr, dpr);

      // 背景
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, totalH);

      // 绘制工具函数
      function text(str, x, y, opts) {
        opts = opts || {};
        ctx.font = (opts.bold ? 'bold ' : '') + (opts.size || 14) + 'px -apple-system, sans-serif';
        ctx.fillStyle = opts.color || '#1c1f24';
        ctx.textAlign = opts.align || 'left';
        ctx.fillText(str || '', x, y);
      }

      function line(x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(28,31,36,0.08)';
        ctx.lineWidth = 0.5;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
      }

      var cy = 50;

      // 账单名
      text(bill.name || 'AA账单', PAD, cy, { size: 22, bold: true });
      cy += 28;

      // 日期
      var d = new Date(bill.createdAt);
      var ds = d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
      text('创建于 ' + ds, PAD, cy, { size: 12, color: '#8d93a6' });
      cy += 36;

      // 汇总卡片
      ctx.fillStyle = '#e8f7f3';
      roundRect(PAD, cy, contentW, 70, 10);

      var colW = contentW / 3;
      var perPerson = members.length > 0 ? (bill.totalAmount || 0) / members.length : 0;

      text('总金额', PAD + colW * 0.5, cy + 24, { size: 11, color: '#8d93a6', align: 'center' });
      text('¥' + Number(bill.totalAmount || 0).toFixed(2), PAD + colW * 0.5, cy + 48, { size: 16, bold: true, color: '#23c4aa', align: 'center' });
      text('成员', PAD + colW * 1.5, cy + 24, { size: 11, color: '#8d93a6', align: 'center' });
      text(members.length + '人', PAD + colW * 1.5, cy + 48, { size: 16, bold: true, align: 'center' });
      text('人均', PAD + colW * 2.5, cy + 24, { size: 11, color: '#8d93a6', align: 'center' });
      text('¥' + Number(perPerson).toFixed(2), PAD + colW * 2.5, cy + 48, { size: 16, bold: true, align: 'center' });
      cy += 94;

      // 消费记录
      var catEmoji = { '餐饮': '🍽️', '交通': '🚗', '住宿': '🏨', '娱乐': '🎮', '购物': '🛍️', '其他': '📦' };
      if (expenses.length > 0) {
        text('消费记录 (' + expenses.length + ')', PAD, cy, { size: 13, bold: true, color: '#8d93a6' });
        cy += 20;
        line(PAD, cy, W - PAD, cy);
        cy += 10;
        for (var i = 0; i < expenses.length; i++) {
          var exp = expenses[i];
          text((catEmoji[exp.category] || '📦') + ' ' + (exp.category || '其他'), PAD, cy + 14, { size: 13 });
          text(exp.payer || '', PAD + 160, cy + 14, { size: 12, color: '#8d93a6' });
          text('¥' + Number(exp.amount || 0).toFixed(2), W - PAD, cy + 14, { size: 14, bold: true, align: 'right' });
          cy += 36;
          if (i < expenses.length - 1) line(PAD + 10, cy, W - PAD - 10, cy);
          cy += 8;
        }
        cy += 10;
      }

      // 参与成员
      if (members.length > 0) {
        text('参与成员 (' + members.length + ')', PAD, cy, { size: 13, bold: true, color: '#8d93a6' });
        cy += 20;
        line(PAD, cy, W - PAD, cy);
        cy += 10;
        for (var j = 0; j < members.length; j++) {
          var mem = members[j];
          text('👤 ' + (mem.userName || mem.userId || '未知'), PAD, cy + 14, { size: 13 });
          text('应付 ¥' + Number(mem.shareAmount || 0).toFixed(2), W - PAD, cy + 14, { size: 13, align: 'right', color: '#8d93a6' });
          cy += 36;
          if (j < members.length - 1) line(PAD + 10, cy, W - PAD - 10, cy);
          cy += 8;
        }
        cy += 10;
      }

      // 底部
      text('AA记账 · 轻松分账', W / 2, cy + 10, { size: 11, color: '#c7c7cc', align: 'center' });

      // 导出图片
      setTimeout(function () {
        wx.canvasToTempFilePath({
          canvas: canvas,
          success: function (tmpRes) {
            wx.saveImageToPhotosAlbum({
              filePath: tmpRes.tempFilePath,
              success: function () {
                wx.hideLoading();
                wx.showToast({ title: '已保存到相册', icon: 'success' });
                that.setData({ exporting: false });
              },
              fail: function (err) {
                wx.hideLoading();
                if (err.errMsg && err.errMsg.indexOf('auth deny') !== -1) {
                  wx.showModal({
                    title: '需要授权',
                    content: '请在设置中允许保存到相册',
                    confirmText: '去设置',
                    success: function (mRes) {
                      if (mRes.confirm) wx.openSetting();
                    }
                  });
                } else {
                  wx.showToast({ title: '保存失败', icon: 'none' });
                }
                that.setData({ exporting: false });
              }
            });
          },
          fail: function () {
            wx.hideLoading();
            wx.showToast({ title: '生成图片失败', icon: 'none' });
            that.setData({ exporting: false });
          }
        });
      }, 300);
    });
  },

  // ========== 登录 ==========

  onLoginNameInput(e) {
    this.setData({ loginName: e.detail.value });
  },

  onLoginNameBlur(e) {
    if (e.detail.value) {
      this.setData({ loginName: e.detail.value });
    }
  },

  async handleLogin() {
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
      loginName: ''
    });
    // 登录后自动加入账单并加载数据
    this.data._joined = false;
    this.onShow();
  },

  // 分享
  onShareAppMessage() {
    var bill = this.data.bill || {};
    return {
      title: '邀请你加入「' + (bill.name || 'AA账单') + '」AA账单',
      path: '/pages/bill-detail/bill-detail?id=' + this.data.billId + '&invite=true'
    };
  },

  formatAmount(amount) {
    return formatAmount(amount);
  },

  getCategoryEmoji(category) {
    return getCategoryEmoji(category);
  }
});
