# AA 记账 - 微信云开发部署指南（无需服务器）

## 方案概述

本方案使用**微信云开发**，无需购买服务器、无需配置数据库，**完全免费**即可部署完整的 AA 记账小程序。

### 为什么选云开发？

| 对比项 | 传统云端部署 | 微信云开发 |
|--------|-------------|-----------|
| 服务器成本 | 60-100元/月 | **0元** |
| 数据库成本 | 50元/月起 | **0元** |
| 域名备案 | 需要（7-20天） | **不需要** |
| HTTPS证书 | 需要申请配置 | **自带** |
| 部署时间 | 1-2天 | **2小时** |
| 维护成本 | 需要运维 | **零运维** |

### 免费额度（个人使用完全够用）

| 资源 | 免费额度 | 个人记账够用吗？ |
|------|---------|----------------|
| 云函数调用 | 5万次/月 | ✅ 足够 |
| 云数据库容量 | 2GB | ✅ 足够 |
| 云存储 | 5GB | ✅ 足够 |
| 数据库读操作 | 5万次/天 | ✅ 足够 |
| 数据库写操作 | 3万次/天 | ✅ 足够 |

---

## 快速开始（30分钟跑起来）

### 步骤 1：准备工作（5分钟）

1. **注册小程序账号**
   - 访问 [微信公众平台](https://mp.weixin.qq.com/)
   - 注册「小程序」账号（个人主体即可）
   - 记录 AppID（后续需要）

2. **下载微信开发者工具**
   - [下载地址](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
   - 安装并登录

### 步骤 2：创建云开发项目（5分钟）

1. 打开微信开发者工具
2. 点击「+」创建新项目
3. 填写信息：
   - 项目名称：`aa-bill-miniprogram`
   - 目录：选择本地文件夹
   - AppID：填写你的小程序 AppID
   - 后端服务：**选择「微信云开发」**
   - 模板：选择「不使用模板」
4. 点击「创建」

### 步骤 3：开启云开发环境（5分钟）

1. 进入项目后，点击工具栏的「云开发」按钮
2. 点击「开通」
3. 选择「免费版」
4. 创建环境，记录**环境 ID**（如：`aabill-xxx`）

### 步骤 4：创建数据库集合（5分钟）

1. 在云开发控制台，点击「数据库」
2. 创建以下集合：

```
集合名：bills（账单）
权限：所有用户可读，仅创建者可写

集合名：expenses（消费记录）
权限：所有用户可读，仅创建者可写

集合名：users（用户信息）
权限：仅创建者可读写
```

### 步骤 5：初始化云开发（5分钟）

修改小程序入口文件：

```javascript
// miniprogram/app.js
App({
  onLaunch() {
    // 初始化云开发
    wx.cloud.init({
      env: '你的环境ID',  // 如：'aabill-xxx'
      traceUser: true,    // 记录用户访问
    });
    console.log('云开发初始化成功');
  },
  
  globalData: {
    userInfo: null
  }
});
```

```json
// miniprogram/app.json
{
  "pages": [
    "pages/index/index",
    "pages/bill-detail/bill-detail",
    "pages/add-expense/add-expense",
    "pages/statistics/statistics"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#fff",
    "navigationBarTitleText": "AA记账",
    "navigationBarTextStyle": "black"
  },
  "cloud": true,
  "sitemapLocation": "sitemap.json"
}
```

---

## 核心功能实现

### 1. 账单列表页

```javascript
// miniprogram/pages/index/index.js
const db = wx.cloud.database();

Page({
  data: {
    bills: [],
    loading: false
  },

  onLoad() {
    this.loadBills();
  },

  onShow() {
    this.loadBills();
  },

  // 加载账单列表
  async loadBills() {
    this.setData({ loading: true });
    
    try {
      const { data } = await db.collection('bills')
        .orderBy('createdAt', 'desc')
        .get();
      
      this.setData({ 
        bills: data,
        loading: false 
      });
    } catch (err) {
      console.error('加载失败', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  // 创建账单
  async createBill() {
    const { result } = await wx.showModal({
      title: '创建账单',
      editable: true,
      placeholderText: '输入账单名称'
    });

    if (!result.confirm || !result.content) return;

    try {
      const userInfo = await this.getUserInfo();
      
      await db.collection('bills').add({
        data: {
          name: result.content,
          description: '',
          totalAmount: 0,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate(),
          createdBy: userInfo.openid,
          creatorName: userInfo.nickName,
          creatorAvatar: userInfo.avatarUrl,
          members: [{
            openid: userInfo.openid,
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl
          }]
        }
      });

      wx.showToast({ title: '创建成功' });
      this.loadBills();
    } catch (err) {
      console.error('创建失败', err);
      wx.showToast({ title: '创建失败', icon: 'none' });
    }
  },

  // 获取用户信息
  getUserInfo() {
    return new Promise((resolve) => {
      wx.getUserProfile({
        desc: '用于展示用户头像和昵称',
        success: (res) => {
          const { openid } = wx.cloud.getWXContext();
          resolve({
            openid,
            ...res.userInfo
          });
        },
        fail: () => {
          resolve({
            openid: wx.cloud.getWXContext().openid,
            nickName: '微信用户',
            avatarUrl: ''
          });
        }
      });
    });
  },

  // 进入账单详情
  goToDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/bill-detail/bill-detail?id=${id}`
    });
  }
});
```

```html
<!-- miniprogram/pages/index/index.wxml -->
<view class="container">
  <!-- 标题 -->
  <view class="header">
    <text class="title">我的账单</text>
    <button class="add-btn" bindtap="createBill">+ 创建账单</button>
  </view>

  <!-- 账单列表 -->
  <view class="bill-list">
    <block wx:if="{{bills.length > 0}}">
      <view 
        class="bill-card" 
        wx:for="{{bills}}" 
        wx:key="_id"
        data-id="{{item._id}}"
        bindtap="goToDetail"
      >
        <view class="bill-info">
          <text class="bill-name">{{item.name}}</text>
          <text class="bill-meta">{{item.members.length}}人参与</text>
        </view>
        <view class="bill-amount">
          <text class="amount">¥{{item.totalAmount || 0}}</text>
          <text class="arrow">›</text>
        </view>
      </view>
    </block>
    
    <!-- 空状态 -->
    <view wx:else class="empty-state">
      <text>还没有账单</text>
      <text class="sub">点击上方按钮创建</text>
    </view>
  </view>
</view>
```

```css
/* miniprogram/pages/index/index.wxss */
.container {
  padding: 20rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

.add-btn {
  background: #07c160;
  color: white;
  font-size: 28rpx;
  padding: 16rpx 32rpx;
  border-radius: 40rpx;
  border: none;
}

.bill-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.bill-card {
  background: white;
  border-radius: 24rpx;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}

.bill-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  display: block;
}

.bill-meta {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.bill-amount {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.amount {
  font-size: 36rpx;
  font-weight: bold;
  color: #ff6b6b;
}

.arrow {
  font-size: 32rpx;
  color: #ccc;
}

.empty-state {
  text-align: center;
  padding: 200rpx 0;
  color: #999;
}

.empty-state .sub {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
}
```

### 2. 账单详情页

```javascript
// miniprogram/pages/bill-detail/bill-detail.js
const db = wx.cloud.database();
const _ = db.command;

Page({
  data: {
    bill: null,
    expenses: [],
    loading: true,
    billId: ''
  },

  onLoad(options) {
    this.setData({ billId: options.id });
    this.loadBillDetail(options.id);
  },

  async loadBillDetail(billId) {
    try {
      // 并行加载账单和消费记录
      const [billRes, expensesRes] = await Promise.all([
        db.collection('bills').doc(billId).get(),
        db.collection('expenses')
          .where({ billId })
          .orderBy('createdAt', 'desc')
          .get()
      ]);

      this.setData({
        bill: billRes.data,
        expenses: expensesRes.data,
        loading: false
      });
    } catch (err) {
      console.error('加载失败', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 添加消费
  addExpense() {
    wx.navigateTo({
      url: `/pages/add-expense/add-expense?billId=${this.data.billId}`
    });
  },

  // 查看结算
  viewSettlement() {
    wx.navigateTo({
      url: `/pages/statistics/statistics?billId=${this.data.billId}`
    });
  },

  // 邀请好友
  inviteFriend() {
    // 生成小程序码分享
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadBillDetail(this.data.billId);
    wx.stopPullDownRefresh();
  }
});
```

### 3. 添加消费页

```javascript
// miniprogram/pages/add-expense/add-expense.js
const db = wx.cloud.database();

Page({
  data: {
    billId: '',
    bill: null,
    description: '',
    amount: '',
    paidBy: '',
    participants: []
  },

  onLoad(options) {
    this.setData({ billId: options.billId });
    this.loadBillInfo(options.billId);
  },

  async loadBillInfo(billId) {
    const { data } = await db.collection('bills').doc(billId).get();
    this.setData({
      bill: data,
      participants: data.members.map(m => m.openid),
      paidBy: data.members[0]?.openid
    });
  },

  onDescriptionChange(e) {
    this.setData({ description: e.detail.value });
  },

  onAmountChange(e) {
    this.setData({ amount: e.detail.value });
  },

  onPaidByChange(e) {
    this.setData({ paidBy: e.detail.value });
  },

  onParticipantsChange(e) {
    this.setData({ participants: e.detail.value });
  },

  async submit() {
    const { billId, description, amount, paidBy, participants } = this.data;
    
    if (!description || !amount || !paidBy) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    try {
      // 添加消费记录
      await db.collection('expenses').add({
        data: {
          billId,
          description,
          amount: parseFloat(amount),
          paidBy,
          participants,
          createdAt: db.serverDate()
        }
      });

      // 更新账单总金额
      await db.collection('bills').doc(billId).update({
        data: {
          totalAmount: _.inc(parseFloat(amount)),
          updatedAt: db.serverDate()
        }
      });

      wx.showToast({ title: '添加成功' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } catch (err) {
      console.error('添加失败', err);
      wx.showToast({ title: '添加失败', icon: 'none' });
    }
  }
});
```

### 4. 结算统计页

```javascript
// miniprogram/pages/statistics/statistics.js
const db = wx.cloud.database();

Page({
  data: {
    billId: '',
    bill: null,
    expenses: [],
    settlements: [],
    categoryStats: [],
    loading: true
  },

  onLoad(options) {
    this.setData({ billId: options.billId });
    this.loadData(options.billId);
  },

  async loadData(billId) {
    try {
      const [billRes, expensesRes] = await Promise.all([
        db.collection('bills').doc(billId).get(),
        db.collection('expenses').where({ billId }).get()
      ]);

      const bill = billRes.data;
      const expenses = expensesRes.data;

      // 计算结算方案
      const settlements = this.calculateSettlement(bill, expenses);
      
      // 计算分类统计
      const categoryStats = this.calculateCategoryStats(expenses);

      this.setData({
        bill,
        expenses,
        settlements,
        categoryStats,
        loading: false
      });
    } catch (err) {
      console.error('加载失败', err);
    }
  },

  // 计算结算方案（简化版）
  calculateSettlement(bill, expenses) {
    const members = bill.members;
    const balances = {};
    
    // 初始化余额
    members.forEach(m => {
      balances[m.openid] = { 
        ...m, 
        paid: 0, 
        shouldPay: 0 
      };
    });

    // 统计每个人的支出和应付款
    expenses.forEach(expense => {
      const payer = expense.paidBy;
      const amount = expense.amount;
      const participantCount = expense.participants.length;
      const share = amount / participantCount;

      // 付款人支出
      if (balances[payer]) {
        balances[payer].paid += amount;
      }

      // 每人应付款
      expense.participants.forEach(pid => {
        if (balances[pid]) {
          balances[pid].shouldPay += share;
        }
      });
    });

    // 计算净额（正数表示应收，负数表示应付）
    const netBalances = Object.values(balances).map((b: any) => ({
      ...b,
      net: b.paid - b.shouldPay
    }));

    // 生成转账方案
    const debtors = netBalances.filter((b: any) => b.net < 0).sort((a: any, b: any) => a.net - b.net);
    const creditors = netBalances.filter((b: any) => b.net > 0).sort((a: any, b: any) => b.net - a.net);

    const transfers = [];
    let i = 0, j = 0;
    
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(Math.abs(debtor.net), creditor.net);

      if (amount > 0.01) {
        transfers.push({
          from: debtor.nickName,
          fromAvatar: debtor.avatarUrl,
          to: creditor.nickName,
          toAvatar: creditor.avatarUrl,
          amount: amount.toFixed(2)
        });
      }

      debtor.net += amount;
      creditor.net -= amount;

      if (Math.abs(debtor.net) < 0.01) i++;
      if (creditor.net < 0.01) j++;
    }

    return transfers;
  },

  // 计算分类统计
  calculateCategoryStats(expenses) {
    const categories: Record<string, number> = {};
    expenses.forEach(e => {
      const cat = e.description || '其他';
      categories[cat] = (categories[cat] || 0) + e.amount;
    });
    
    return Object.entries(categories)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }
});
```

---

## 高级功能

### 1. 小程序码分享

```javascript
// 云函数：生成小程序码
const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event) => {
  const { billId } = event;
  
  try {
    const result = await cloud.openapi.wxacode.getUnlimited({
      scene: `billId=${billId}`,
      page: 'pages/bill-detail/bill-detail',
      width: 280
    });
    
    // 上传到云存储
    const upload = await cloud.uploadFile({
      cloudPath: `qrcodes/${billId}.png`,
      fileContent: result.buffer
    });
    
    return {
      code: 0,
      fileID: upload.fileID
    };
  } catch (err) {
    return { code: -1, message: err.message };
  }
};
```

### 2. 订阅消息提醒

```javascript
// 请求订阅授权
wx.requestSubscribeMessage({
  tmplIds: ['你的模板ID'],
  success: (res) => {
    if (res['你的模板ID'] === 'accept') {
      // 保存订阅状态
    }
  }
});

// 发送订阅消息（在云函数中）
await cloud.openapi.subscribeMessage.send({
  touser: OPENID,
  templateId: '你的模板ID',
  page: 'pages/bill-detail/bill-detail',
  data: {
    thing1: { value: '周末聚餐' },
    amount2: { value: '150.00元' },
    name3: { value: '张三' }
  }
});
```

### 3. 数据导出

```javascript
// 导出账单数据为 Excel
const exportData = async () => {
  const { data } = await db.collection('expenses')
    .where({ billId: 'xxx' })
    .get();
  
  // 转换为 CSV 格式
  const csv = convertToCSV(data);
  
  // 保存到本地
  const fs = wx.getFileSystemManager();
  const filePath = `${wx.env.USER_DATA_PATH}/bill_export.csv`;
  fs.writeFileSync(filePath, csv);
  
  // 分享文件
  wx.shareFileMessage({
    filePath,
    fileName: '账单导出.csv'
  });
};
```

---

## 发布上线

### 步骤 1：预览测试

1. 在微信开发者工具中点击「预览」
2. 使用手机微信扫描二维码
3. 完整测试所有功能

### 步骤 2：提交审核

1. 点击「上传」按钮
2. 填写版本号和项目备注
3. 登录[微信公众平台](https://mp.weixin.qq.com)
4. 进入「版本管理」
5. 提交审核（选择「工具」类目）

### 步骤 3：发布

审核通过后（通常 1-3 天），点击「发布」即可上线。

---

## 注意事项

### 数据库权限

务必正确设置数据库权限，防止数据泄露：

```json
// bills 集合权限
{
  "read": true,
  "write": "doc._openid == auth.openid"
}
```

### 云函数调用限制

如果免费额度用完，可以通过以下方式优化：
- 将多个操作合并到一个云函数中
- 使用本地缓存减少数据库查询
- 开启客户端直接操作数据库（简单场景）

### 数据备份

建议定期导出数据：

```javascript
// 在云开发控制台 → 数据库 → 导出
// 选择集合 → 导出为 JSON
```

---

## 总结

使用微信云开发部署 AA 记账小程序：

✅ **零成本** - 个人使用完全免费  
✅ **快速上线** - 2 小时可完成基础版本  
✅ **免运维** - 无需关心服务器和数据库  
✅ **功能完整** - 支持多人协作、实时同步  
✅ **安全可靠** - 数据存储在微信云端

**立即开始**：下载微信开发者工具 → 创建云开发项目 → 复制上面的代码 → 30 分钟后就能用了！
