const api = require('../../utils/api');
const { formatAmount, formatDate } = require('../../utils/util');

Page({
  data: {
    bills: [],
    loading: true,
    showCreateDialog: false,
    newBillName: '',
    creating: false
  },

  onShow() {
    this.loadBills();
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
    this.loadBills().then(() => wx.stopPullDownRefresh());
  },

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

  formatAmount(amount) {
    return formatAmount(amount);
  },

  formatDate(dateStr) {
    return formatDate(dateStr);
  }
});
