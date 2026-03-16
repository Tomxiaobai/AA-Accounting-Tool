const api = require('../../utils/api');
const { formatAmount, getCategoryEmoji } = require('../../utils/util');

Page({
  data: {
    billId: '',
    loading: true,
    stats: null,
    activeTab: 'category'
  },

  onLoad(options) {
    this.setData({ billId: options.id });
    this.loadStatistics();
  },

  async loadStatistics() {
    try {
      this.setData({ loading: true });
      const stats = await api.getStatistics(this.data.billId, 'all');
      this.setData({ stats, loading: false });
    } catch (err) {
      console.error('加载统计数据失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  }
});
