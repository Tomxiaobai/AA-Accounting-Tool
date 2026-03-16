// 格式化金额
function formatAmount(amount) {
  return '¥' + Number(amount || 0).toFixed(2);
}

// 格式化日期
function formatDate(dateStr) {
  const d = new Date(dateStr);
  var month = d.getMonth() + 1;
  var day = d.getDate();
  return d.getFullYear() + '/' + (month < 10 ? '0' + month : month) + '/' + (day < 10 ? '0' + day : day);
}

// 分类emoji映射
function getCategoryEmoji(category) {
  const map = {
    '餐饮': '🍽️',
    '交通': '🚗',
    '住宿': '🏨',
    '娱乐': '🎮',
    '购物': '🛍️',
    '其他': '📦'
  };
  return map[category] || '📦';
}

// 消费分类列表
const EXPENSE_CATEGORIES = ['餐饮', '交通', '住宿', '娱乐', '购物', '其他'];

module.exports = {
  formatAmount,
  formatDate,
  getCategoryEmoji,
  EXPENSE_CATEGORIES
};
