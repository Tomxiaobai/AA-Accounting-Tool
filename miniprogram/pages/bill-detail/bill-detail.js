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
    _joined: false
  },

  onLoad(options) {
    this.setData({ billId: options.id });
  },

  async onShow() {
    if (!this.data.billId) return;

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
