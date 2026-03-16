# AA 记账 - 微信小程序部署指南

## 架构说明

当前 AA 记账是基于 **React + NestJS** 的 Web 应用架构，与微信小程序架构有本质区别：

| 对比项 | Web 应用 | 微信小程序 |
|--------|----------|------------|
| 前端框架 | React + DOM | 小程序原生 / Taro / UniApp |
| 样式方案 | Tailwind CSS | WXSS |
| 路由方案 | React Router | 小程序页面栈 |
| 网络请求 | axios / fetch | wx.request |
| 运行环境 | 浏览器 | 微信客户端 |

> **重要**：React Web 应用不能直接部署到微信小程序，需要进行架构改造。

---

## 部署方案概述

采用**「后端 API 独立部署 + 小程序前端改造」**方案：

```
┌─────────────────┐         HTTPS          ┌─────────────────┐
│   微信小程序     │  ◄──────────────────►  │   后端 API      │
│  (Taro/UniApp)  │                        │  (NestJS部署)   │
└─────────────────┘                        └─────────────────┘
```

---

## 方案一：使用 Taro 跨端框架（推荐）

Taro 支持将 React 代码编译为小程序代码，最大程度复用现有代码。

### 1. 后端 API 部署

#### 步骤 1：部署后端服务

```bash
# 构建后端
npm run build:server

# 部署到服务器（确保支持 HTTPS）
scp -r dist/server user@server:/app/
scp -r dist/node_modules user@server:/app/
scp scripts/run.sh user@server:/app/
```

#### 步骤 2：配置 HTTPS

小程序要求后端 API 必须使用 HTTPS 协议。

```nginx
# Nginx 配置示例
server {
    listen 443 ssl;
    server_name api.aabill.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 步骤 3：配置小程序白名单

登录[微信公众平台](https://mp.weixin.qq.com)，进入：
**开发 → 开发管理 → 开发设置 → 服务器域名**

添加以下域名：
- `request合法域名`: `https://api.aabill.com`
- `uploadFile合法域名`: （如有图片上传需要）
- `downloadFile合法域名`: （如有图片下载需要）

### 2. 小程序前端改造

#### 步骤 1：创建 Taro 项目

```bash
# 全局安装 Taro 脚手架
npm install -g @tarojs/cli

# 创建小程序项目
taro init aa-bill-miniprogram

# 选择：React + TypeScript + 微信小程序 + 默认模板
```

#### 步骤 2：迁移 API 类型定义

```bash
# 复制共享类型
cp shared/api.interface.ts aa-bill-miniprogram/src/types/
```

#### 步骤 3：封装小程序 HTTP 请求

```typescript
// src/utils/request.ts
const API_BASE = 'https://api.aabill.com/api';

export function request<T>(options: {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
}): Promise<T> {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
        } else {
          reject(res);
        }
      },
      fail: reject,
    });
  });
}
```

#### 步骤 4：实现小程序页面

```typescript
// src/pages/index/index.tsx
import { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import { request } from '../../utils/request';
import type { Bill, BillListResponse } from '../../types/api.interface';

export default function Index() {
  const [bills, setBills] = useState<Bill[]>([]);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    const res = await request<BillListResponse>({ url: '/bills' });
    setBills(res.items);
  };

  return (
    <View className="index">
      <Text className="title">我的账单</Text>
      {bills.map((bill) => (
        <View key={bill.id} className="bill-item">
          <Text>{bill.name}</Text>
          <Text>¥{bill.totalAmount}</Text>
        </View>
      ))}
      <Button onClick={() => createBill()}>创建账单</Button>
    </View>
  );
}
```

#### 步骤 5：构建小程序

```bash
cd aa-bill-miniprogram

# 开发模式
npm run dev:weapp

# 生产构建
npm run build:weapp
```

构建产物位于 `dist/weapp/` 目录。

### 3. 小程序发布

#### 步骤 1：导入微信开发者工具

1. 下载[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 选择「小程序」项目
3. 导入 `aa-bill-miniprogram/dist/weapp` 目录
4. 填写 AppID（在小程序后台获取）

#### 步骤 2：预览和调试

- 点击「预览」生成二维码，手机微信扫码测试
- 使用真机调试功能查看请求响应

#### 步骤 3：提交审核

1. 点击「上传」按钮上传代码
2. 登录[微信公众平台](https://mp.weixin.qq.com)
3. 进入「版本管理」
4. 将开发版本提交审核

#### 步骤 4：发布上线

审核通过后，在「版本管理」中点击「发布」即可上线。

---

## 方案二：使用 UniApp 跨端框架

UniApp 是另一种跨端方案，支持 Vue/React，语法更接近原生小程序。

### 快速开始

```bash
# 安装 UniApp 脚手架
npx degit dcloudio/uni-preset-vue#vite-ts aa-bill-uniapp
cd aa-bill-uniapp
npm install

# 安装 UniApp 插件
npm install @dcloudio/uni-app @dcloudio/uni-h5

# 开发模式
npm run dev:mp-weixin

# 生产构建
npm run build:mp-weixin
```

其他步骤与 Taro 方案类似。

---

## 小程序功能适配

### 1. 用户登录

小程序使用微信登录，需要改造后端：

```typescript
// 小程序登录接口
@Post('auth/wx-login')
async wxLogin(@Body() dto: WxLoginDto) {
  const { code } = dto;
  // 调用微信 auth.code2Session 获取 openid
  const session = await this.wxService.code2Session(code);
  // 创建或查询用户，返回 token
  return this.authService.loginWithOpenId(session.openid);
}
```

### 2. 分享功能

```typescript
// 页面分享配置
onShareAppMessage() {
  return {
    title: `AA账单：${this.bill.name}`,
    path: `/pages/bill/detail?id=${this.bill.id}`,
  };
}
```

### 3. 二维码邀请

```typescript
// 生成小程序码
async generateQRCode(billId: string) {
  const accessToken = await this.wxService.getAccessToken();
  const response = await axios.post(
    `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`,
    {
      scene: `billId=${billId}`,
      page: 'pages/bill/detail',
      width: 280,
    },
    { responseType: 'arraybuffer' }
  );
  return response.data;
}
```

---

## 小程序特有功能建议

### 1. 订阅消息

用户消费后发送订阅消息提醒：

```typescript
// 请求订阅权限
wx.requestSubscribeMessage({
  tmplIds: ['消费提醒模板ID'],
  success: (res) => {
    console.log('订阅成功', res);
  },
});
```

### 2. 群聊分享

```typescript
// 分享到群聊
onShareTimeline() {
  return {
    title: '一起来AA记账吧！',
    query: 'invite=true',
  };
}
```

### 3. 微信支付（可选）

如需支持直接转账结算，可接入微信支付：

```typescript
wx.requestPayment({
  timeStamp: '',
  nonceStr: '',
  package: '',
  signType: 'RSA',
  paySign: '',
  success: (res) => {},
});
```

---

## 注意事项

### 1. 包体积限制

- 小程序代码包上限：2MB
- 使用分包加载优化

```json
// app.json
{
  "subPackages": [
    {
      "root": "package-statistics",
      "pages": ["pages/statistics/index"]
    }
  ]
}
```

### 2. 网络请求限制

- 必须配置 request 合法域名
- HTTPS 证书必须有效
- 不支持 http

### 3. 文件上传

```typescript
wx.chooseImage({
  success: (res) => {
    wx.uploadFile({
      url: 'https://api.aabill.com/upload',
      filePath: res.tempFilePaths[0],
      name: 'file',
    });
  },
});
```

### 4. 存储限制

- 小程序 Storage 上限 10MB
- 敏感数据建议使用后端存储

---

## 完整部署流程图

```
┌─────────────────────────────────────────────────────────────┐
│                     微信小程序部署流程                        │
└─────────────────────────────────────────────────────────────┘

  ┌──────────┐
  │ 后端部署  │
  └─────┬────┘
        │
        ▼
  ┌─────────────────────┐
  │ 1. npm run build    │
  │ 2. 部署到服务器      │
  │ 3. 配置 HTTPS       │
  │ 4. 配置域名白名单    │
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │ 小程序前端开发       │
  │ (Taro/UniApp)       │
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │ 1. 创建 Taro 项目    │
  │ 2. 迁移 API 和页面   │
  │ 3. 适配小程序 API    │
  │ 4. npm run build    │
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │ 微信开发者工具       │
  │ 预览和调试          │
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │ 上传代码            │
  │ 提交审核            │
  │ 发布上线            │
  └─────────────────────┘
```

---

## 总结

部署到微信小程序需要：

1. **后端 API 独立部署** - 配置 HTTPS，添加域名白名单
2. **前端代码重构** - 使用 Taro/UniApp 重写，复用业务逻辑
3. **微信生态适配** - 登录、分享、订阅消息等
4. **测试和发布** - 开发者工具调试，提交审核

建议先完成后端部署和测试，再开始小程序前端开发。
