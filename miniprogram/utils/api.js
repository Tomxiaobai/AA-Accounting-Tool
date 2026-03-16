function request(options) {
  var app = getApp();
  var url = app.globalData.baseUrl + options.url;
  console.log('[API] ' + (options.method || 'GET') + ' ' + url, options.data || '');
  return new Promise(function(resolve, reject) {
    wx.request({
      url: url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'x-user-id': app.globalData.userId || 'user_default',
        'x-user-name': app.globalData.userName || 'default_user'
      },
      success: function(res) {
        console.log('[API] Response ' + res.statusCode, res.data);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          console.error('[API] Error: status=' + res.statusCode, res.data);
          reject(res);
        }
      },
      fail: function(err) {
        console.error('[API] Request failed:', err);
        reject(err);
      }
    });
  });
}

// 获取账单列表
function getBills(page, pageSize) {
  page = page || 1;
  pageSize = pageSize || 20;
  return request({ url: '/api/bills?page=' + page + '&pageSize=' + pageSize });
}

// 创建账单
function createBill(name) {
  return request({ url: '/api/bills', method: 'POST', data: { name: name } });
}

// 获取账单详情
function getBillDetail(billId) {
  return request({ url: '/api/bills/' + billId });
}

// 获取消费记录
function getBillExpenses(billId) {
  return request({ url: '/api/bills/' + billId + '/expenses' });
}

// 获取成员列表
function getBillMembers(billId) {
  return request({ url: '/api/bills/' + billId + '/members' });
}

// 添加成员
function addMember(billId, userId) {
  return request({ url: '/api/bills/' + billId + '/members', method: 'POST', data: { userId: userId } });
}

// 添加消费记录
function addExpense(billId, data) {
  return request({ url: '/api/bills/' + billId + '/expenses', method: 'POST', data: data });
}

// 获取统计数据
function getStatistics(billId, type) {
  type = type || 'all';
  return request({ url: '/api/bills/' + billId + '/statistics?type=' + type });
}

// 加入账单
function joinBill(billId) {
  return request({ url: '/api/bills/join/' + billId, method: 'POST' });
}

// 获取结算数据
function getSettlement(billId) {
  return request({ url: '/api/bills/' + billId + '/settlement' });
}

module.exports = {
  getBills: getBills,
  createBill: createBill,
  getBillDetail: getBillDetail,
  getBillExpenses: getBillExpenses,
  getBillMembers: getBillMembers,
  addMember: addMember,
  addExpense: addExpense,
  getStatistics: getStatistics,
  joinBill: joinBill,
  getSettlement: getSettlement
};
