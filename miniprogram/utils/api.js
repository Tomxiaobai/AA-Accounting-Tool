/**
 * API 层 - 基于微信云开发数据模型 (models)
 *
 * 需在云开发控制台创建以下数据模型（标识名必须一致）：
 *   - bills:    账单 (name, creator, createdAt, updatedAt)
 *   - members:  成员 (billId, userId, userName, createdAt)
 *   - expenses: 消费记录 (billId, amount, category, note, payer, createdAt)
 */

function getModels() {
  return getApp().globalData.models;
}

function getUserId() {
  return getApp().globalData.userId || 'user_default';
}

function getUserName() {
  return getApp().globalData.userName || 'default_user';
}

// ==================== 账单 ====================

async function getBills(page, pageSize) {
  page = page || 1;
  pageSize = pageSize || 20;
  var models = getModels();
  var userName = getUserName();

  // 先查出当前用户参与的所有账单ID
  var myMemRes = await models.members.list({
    filter: { where: { userId: { $eq: userName } } },
    pageSize: 1000
  });
  var myMems = (myMemRes.data && myMemRes.data.records) || [];
  var myBillIds = [];
  for (var k = 0; k < myMems.length; k++) {
    myBillIds.push(myMems[k].billId);
  }

  if (myBillIds.length === 0) {
    return { items: [], page: page, pageSize: pageSize };
  }

  // 查询所有账单再过滤（云开发模型不支持 $in）
  var res = await models.bills.list({
    filter: { where: {} },
    pageSize: 1000,
    getCount: true,
    sort: { createdAt: -1 }
  });

  var allBills = (res.data && res.data.records) || [];

  // 用 Set 加速查找
  var billIdSet = {};
  for (var m = 0; m < myBillIds.length; m++) {
    billIdSet[myBillIds[m]] = true;
  }

  var matchedBills = [];
  for (var i = 0; i < allBills.length; i++) {
    var bill = allBills[i];
    bill.id = bill._id;
    if (billIdSet[bill._id] || billIdSet[bill.id]) {
      matchedBills.push(bill);
    }
  }

  // 并行查询每个账单的成员数和消费总额（核心性能优化）
  var enrichTasks = matchedBills.map(function (bill) {
    return Promise.all([
      models.members.list({
        filter: { where: { billId: { $eq: bill._id } } },
        getCount: true,
        pageSize: 1
      }),
      models.expenses.list({
        filter: { where: { billId: { $eq: bill._id } } },
        pageSize: 1000
      })
    ]).then(function (results) {
      bill.memberCount = (results[0].data && results[0].data.total) || 0;
      var total = 0;
      var exps = (results[1].data && results[1].data.records) || [];
      for (var j = 0; j < exps.length; j++) {
        total += Number(exps[j].amount) || 0;
      }
      bill.totalAmount = total;
      return bill;
    });
  });
  var bills = await Promise.all(enrichTasks);

  return { items: bills, page: page, pageSize: pageSize };
}

async function createBill(name) {
  var models = getModels();
  var now = Date.now();

  var res = await models.bills.create({
    data: {
      name: name,
      creator: getUserId(),
      createdAt: now,
      updatedAt: now
    }
  });

  var billId = res.data && (res.data.id || res.data._id);

  // 创建者自动成为成员（用昵称作为标识）
  var userName = getUserName();
  await models.members.create({
    data: {
      billId: String(billId),
      userId: userName,
      userName: userName,
      createdAt: now
    }
  });

  return {
    id: billId,
    name: name,
    totalAmount: 0,
    creator: getUserId(),
    memberCount: 1,
    createdAt: now
  };
}

// 删除账单（同时删除关联的成员和消费记录）
async function deleteBill(billId) {
  var models = getModels();

  // 删除关联消费记录
  var expRes = await models.expenses.list({
    filter: { where: { billId: { $eq: String(billId) } } },
    pageSize: 1000
  });
  var exps = (expRes.data && expRes.data.records) || [];
  for (var i = 0; i < exps.length; i++) {
    await models.expenses.delete({
      filter: { where: { _id: { $eq: exps[i]._id } } }
    });
  }

  // 删除关联成员
  var memRes = await models.members.list({
    filter: { where: { billId: { $eq: String(billId) } } },
    pageSize: 1000
  });
  var mems = (memRes.data && memRes.data.records) || [];
  for (var i = 0; i < mems.length; i++) {
    await models.members.delete({
      filter: { where: { _id: { $eq: mems[i]._id } } }
    });
  }

  // 删除账单本身
  await models.bills.delete({
    filter: { where: { _id: { $eq: billId } } }
  });

  return { success: true };
}

async function getBillDetail(billId) {
  var models = getModels();

  var res = await models.bills.get({
    filter: { where: { _id: { $eq: billId } } }
  });

  var bill = res.data;
  if (!bill) return null;
  bill.id = bill._id;

  // 计算总金额
  var expRes = await models.expenses.list({
    filter: { where: { billId: { $eq: billId } } },
    pageSize: 1000
  });
  var total = 0;
  var exps = (expRes.data && expRes.data.records) || [];
  for (var i = 0; i < exps.length; i++) {
    total += Number(exps[i].amount) || 0;
  }
  bill.totalAmount = total;

  return bill;
}

// ==================== 消费记录 ====================

async function getBillExpenses(billId) {
  var models = getModels();

  var res = await models.expenses.list({
    filter: { where: { billId: { $eq: billId } } },
    pageSize: 1000,
    sort: { createdAt: -1 }
  });

  var records = (res.data && res.data.records) || [];
  for (var i = 0; i < records.length; i++) {
    records[i].id = records[i]._id;
  }
  return { items: records };
}

async function addExpense(billId, expenseData) {
  var models = getModels();
  var now = Date.now();

  // 金额安全校验
  var amount = Number(expenseData.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('金额必须大于0');
  }
  if (amount > 1000000) {
    throw new Error('单笔金额不能超过100万');
  }

  var res = await models.expenses.create({
    data: {
      billId: String(billId),
      amount: amount,
      category: expenseData.category,
      note: expenseData.note || '',
      payer: expenseData.payer,
      createdAt: now
    }
  });

  return { id: res.data && (res.data.id || res.data._id), success: true };
}

// 删除单条消费记录
async function deleteExpense(expenseId) {
  var models = getModels();
  await models.expenses.delete({
    filter: { where: { _id: { $eq: expenseId } } }
  });
  return { success: true };
}

// ==================== 成员 ====================

async function getBillMembers(billId) {
  var models = getModels();

  var res = await models.members.list({
    filter: { where: { billId: { $eq: billId } } },
    pageSize: 1000,
    sort: { createdAt: 1 }
  });

  var records = (res.data && res.data.records) || [];

  // 计算 shareAmount
  var expRes = await models.expenses.list({
    filter: { where: { billId: { $eq: billId } } },
    pageSize: 1000
  });
  var totalAmount = 0;
  var exps = (expRes.data && expRes.data.records) || [];
  for (var j = 0; j < exps.length; j++) {
    totalAmount += Number(exps[j].amount) || 0;
  }
  var sharePerPerson = records.length > 0 ? totalAmount / records.length : 0;

  for (var i = 0; i < records.length; i++) {
    records[i].id = records[i]._id;
    records[i].shareAmount = Math.round(sharePerPerson * 100) / 100;
  }

  return { items: records };
}

async function addMember(billId, nameOrId) {
  var models = getModels();

  // 检查是否已存在（按 userId 查重）
  var res = await models.members.list({
    filter: {
      where: {
        billId: { $eq: String(billId) },
        userId: { $eq: nameOrId }
      }
    },
    pageSize: 1
  });

  var existing = (res.data && res.data.records) || [];
  if (existing.length > 0) {
    return { id: existing[0]._id, success: true };
  }

  var createRes = await models.members.create({
    data: {
      billId: String(billId),
      userId: nameOrId,
      userName: nameOrId,
      createdAt: Date.now()
    }
  });

  return { id: createRes.data && (createRes.data.id || createRes.data._id), success: true };
}

async function joinBill(billId) {
  // 用用户昵称加入账单
  var userName = getUserName();
  return await addMember(billId, userName || getUserId());
}

// ==================== 统计 ====================

async function getStatistics(billId) {
  var models = getModels();

  var expRes = await models.expenses.list({
    filter: { where: { billId: { $eq: billId } } },
    pageSize: 1000
  });
  var expenses = (expRes.data && expRes.data.records) || [];

  var memRes = await models.members.list({
    filter: { where: { billId: { $eq: billId } } },
    getCount: true,
    pageSize: 1
  });
  var memberCount = (memRes.data && memRes.data.total) || 0;

  var totalAmount = 0;
  for (var i = 0; i < expenses.length; i++) {
    totalAmount += Number(expenses[i].amount) || 0;
  }

  // 分类统计
  var categoryMap = {};
  for (var i = 0; i < expenses.length; i++) {
    var cat = expenses[i].category || '其他';
    if (!categoryMap[cat]) categoryMap[cat] = 0;
    categoryMap[cat] += Number(expenses[i].amount) || 0;
  }
  var categoryStats = [];
  for (var cat in categoryMap) {
    categoryStats.push({
      category: cat,
      amount: Math.round(categoryMap[cat] * 100) / 100,
      percentage: totalAmount > 0 ? Math.round(categoryMap[cat] / totalAmount * 10000) / 100 : 0
    });
  }
  categoryStats.sort(function (a, b) { return b.amount - a.amount; });

  // 成员统计
  var memberMap = {};
  var memberExpCount = {};
  for (var i = 0; i < expenses.length; i++) {
    var payer = expenses[i].payer || 'unknown';
    if (!memberMap[payer]) { memberMap[payer] = 0; memberExpCount[payer] = 0; }
    memberMap[payer] += Number(expenses[i].amount) || 0;
    memberExpCount[payer] += 1;
  }
  var memberStats = [];
  for (var uid in memberMap) {
    memberStats.push({
      userId: uid,
      amount: Math.round(memberMap[uid] * 100) / 100,
      percentage: totalAmount > 0 ? Math.round(memberMap[uid] / totalAmount * 10000) / 100 : 0,
      expenseCount: memberExpCount[uid]
    });
  }
  memberStats.sort(function (a, b) { return b.amount - a.amount; });

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalExpenses: expenses.length,
    memberCount: memberCount,
    avgAmount: memberCount > 0 ? Math.round(totalAmount / memberCount * 100) / 100 : 0,
    categoryStats: categoryStats,
    memberStats: memberStats
  };
}

// ==================== 结算 ====================

async function getSettlement(billId) {
  var models = getModels();

  var expRes = await models.expenses.list({
    filter: { where: { billId: { $eq: billId } } },
    pageSize: 1000
  });
  var expenses = (expRes.data && expRes.data.records) || [];

  var memRes = await models.members.list({
    filter: { where: { billId: { $eq: billId } } },
    pageSize: 1000
  });
  var members = (memRes.data && memRes.data.records) || [];

  var totalAmount = 0;
  for (var i = 0; i < expenses.length; i++) {
    totalAmount += Number(expenses[i].amount) || 0;
  }

  var memberCount = members.length;
  var avgAmount = memberCount > 0 ? totalAmount / memberCount : 0;

  var paidMap = {};
  for (var i = 0; i < members.length; i++) paidMap[members[i].userId] = 0;
  for (var i = 0; i < expenses.length; i++) {
    var payer = expenses[i].payer;
    if (paidMap[payer] === undefined) paidMap[payer] = 0;
    paidMap[payer] += Number(expenses[i].amount) || 0;
  }

  var memberSettlements = [];
  for (var i = 0; i < members.length; i++) {
    var uid = members[i].userId;
    var paid = paidMap[uid] || 0;
    memberSettlements.push({
      userId: uid,
      paidAmount: Math.round(paid * 100) / 100,
      shareAmount: Math.round(avgAmount * 100) / 100,
      balance: Math.round((paid - avgAmount) * 100) / 100
    });
  }

  var debtors = [], creditors = [];
  for (var i = 0; i < memberSettlements.length; i++) {
    var m = memberSettlements[i];
    if (m.balance < -0.01) debtors.push({ userId: m.userId, amount: -m.balance });
    else if (m.balance > 0.01) creditors.push({ userId: m.userId, amount: m.balance });
  }
  debtors.sort(function (a, b) { return b.amount - a.amount; });
  creditors.sort(function (a, b) { return b.amount - a.amount; });

  var transfers = [];
  var di = 0, ci = 0;
  while (di < debtors.length && ci < creditors.length) {
    var amt = Math.min(debtors[di].amount, creditors[ci].amount);
    if (amt > 0.01) {
      transfers.push({
        fromUserId: debtors[di].userId,
        toUserId: creditors[ci].userId,
        amount: Math.round(amt * 100) / 100
      });
    }
    debtors[di].amount -= amt;
    creditors[ci].amount -= amt;
    if (debtors[di].amount < 0.01) di++;
    if (creditors[ci].amount < 0.01) ci++;
  }

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    memberCount: memberCount,
    avgAmount: Math.round(avgAmount * 100) / 100,
    members: memberSettlements,
    transfers: transfers
  };
}

module.exports = {
  getBills: getBills,
  createBill: createBill,
  deleteBill: deleteBill,
  getBillDetail: getBillDetail,
  getBillExpenses: getBillExpenses,
  getBillMembers: getBillMembers,
  addMember: addMember,
  addExpense: addExpense,
  deleteExpense: deleteExpense,
  getStatistics: getStatistics,
  joinBill: joinBill,
  getSettlement: getSettlement
};
