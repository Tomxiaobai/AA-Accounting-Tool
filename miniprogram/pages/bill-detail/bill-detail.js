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
    // 结算
    showSettlement: false,
    settlementData: null,
    settlementLoading: false,
    // 添加成员
    showAddMember: false,
    newMemberId: '',
    addingMember: false
  },

  onLoad(options) {
    this.setData({ billId: options.id });
  },

  onShow() {
    if (this.data.billId) {
      this.loadBillData();
    }
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
      this.setData({
        bill,
        expenses: expensesRes.items,
        members: membersRes.items,
        loading: false
      });
      wx.setNavigationBarTitle({ title: bill.name });
    } catch (err) {
      console.error('加载账单数据失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  // 添加消费 - 跳转到添加页
  goAddExpense() {
    wx.navigateTo({
      url: '/pages/add-expense/add-expense?billId=' + this.data.billId
    });
  },

  // 统计
  goStatistics() {
    wx.navigateTo({
      url: '/pages/statistics/statistics?id=' + this.data.billId
    });
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
    this.setData({ showAddMember: true, newMemberId: '' });
  },

  hideAddMember() {
    this.setData({ showAddMember: false, newMemberId: '' });
  },

  onMemberIdInput(e) {
    this.setData({ newMemberId: e.detail.value });
  },

  async handleAddMember() {
    const id = this.data.newMemberId.trim();
    if (!id) {
      wx.showToast({ title: '请输入成员ID', icon: 'none' });
      return;
    }
    try {
      this.setData({ addingMember: true });
      await api.addMember(this.data.billId, id);
      wx.showToast({ title: '添加成功', icon: 'success' });
      this.setData({ showAddMember: false, addingMember: false, newMemberId: '' });
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

  // 工具函数（供 WXML 使用）
  formatAmount(amount) {
    return formatAmount(amount);
  },

  getCategoryEmoji(category) {
    return getCategoryEmoji(category);
  }
});
