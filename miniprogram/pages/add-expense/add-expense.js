const api = require('../../utils/api');
const { EXPENSE_CATEGORIES, getCategoryEmoji } = require('../../utils/util');

Page({
  data: {
    billId: '',
    members: [],
    memberNames: [],
    amount: '',
    category: '餐饮',
    categories: EXPENSE_CATEGORIES,
    note: '',
    selectedPayerIndex: -1,
    submitting: false
  },

  onLoad(options) {
    this.setData({ billId: options.billId });
    this.loadMembers(options.billId);
  },

  async loadMembers(billId) {
    try {
      const res = await api.getBillMembers(billId);
      var members = res.items;
      var names = [];
      for (var i = 0; i < members.length; i++) {
        names.push(members[i].userName || members[i].userId || '未知');
      }
      this.setData({ members: members, memberNames: names });
    } catch (e) {
      console.error('加载成员失败:', e);
    }
  },

  onAmountInput(e) {
    var val = e.detail.value;
    // 过滤负号，只允许正数
    val = val.replace(/-/g, '');
    this.setData({ amount: val });
    // 返回处理后的值给 input 控件
    return { value: val };
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

    if (parseFloat(amount) > 1000000) {
      wx.showToast({ title: '单笔金额不能超过100万', icon: 'none' });
      return;
    }

    if (selectedPayerIndex < 0 || selectedPayerIndex >= members.length) {
      wx.showToast({ title: '请选择付款人', icon: 'none' });
      return;
    }

    // 用 userName 作为 payer（与成员的 userId 一致，因为 addMember 时 userId=name）
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
