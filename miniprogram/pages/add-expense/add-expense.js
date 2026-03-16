const api = require('../../utils/api');
const { EXPENSE_CATEGORIES, getCategoryEmoji } = require('../../utils/util');

Page({
  data: {
    billId: '',
    members: [],
    amount: '',
    category: '餐饮',
    categories: EXPENSE_CATEGORIES,
    note: '',
    selectedPayerIndex: -1,
    submitting: false
  },

  onLoad(options) {
    this.setData({ billId: options.billId });
    // 加载成员列表
    this.loadMembers(options.billId);
  },

  async loadMembers(billId) {
    try {
      const res = await api.getBillMembers(billId);
      this.setData({ members: res.items });
    } catch (e) {
      console.error('加载成员失败:', e);
    }
  },

  onAmountInput(e) {
    this.setData({ amount: e.detail.value });
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  selectCategory(e) {
    this.setData({ category: e.currentTarget.dataset.cat });
  },

  selectPayer(e) {
    this.setData({ selectedPayerIndex: parseInt(e.detail.value) });
  },

  async handleSubmit() {
    const { billId, amount, category, note, selectedPayerIndex, members } = this.data;

    if (!amount || parseFloat(amount) <= 0) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' });
      return;
    }

    if (selectedPayerIndex < 0 || selectedPayerIndex >= members.length) {
      wx.showToast({ title: '请选择付款人', icon: 'none' });
      return;
    }

    const payer = members[selectedPayerIndex].userId;

    try {
      this.setData({ submitting: true });
      await api.addExpense(billId, {
        amount: parseFloat(amount),
        category,
        note: note || undefined,
        payer
      });
      wx.showToast({ title: '添加成功', icon: 'success' });
      setTimeout(function() { wx.navigateBack(); }, 500);
    } catch (err) {
      console.error('添加消费失败:', err);
      wx.showToast({ title: '添加失败', icon: 'none' });
      this.setData({ submitting: false });
    }
  }
});
