# 技术方案

## 开发元信息

- 开发模式: 全栈应用
- 涉及层级: [数据库, 服务端, 前端]

## 页面路由与导航

### 页面路由

- `/` - 账单列表页
- `/bills/:id` - 账单详情页
- `/bills/:id/statistics` - 统计分析页

### 导航设计

- 导航机制：页面路由
- 导航项：
  - 账单列表

## 业务组件

| 组件 | 来源 | 关联页面 | 对应功能点 |
|------|------|---------|-----------|
| UserSelect | @client/src/components/business-ui/user-select | 账单详情页 | 邀请成员选择用户 |
| UserDisplay | @client/src/components/business-ui/user-display | 账单列表页, 账单详情页 | 展示参与用户信息 |
| ReactECharts | @lark-apaas/client-toolkit | 统计分析页 | 展示分类占比饼图 |

## 数据模型

### 数据库设计

#### 账单表（bill）
用途：存储AA账单基本信息，包含名称、总金额、创建者。
核心字段：
- name: varchar (账单名称)
- total_amount: numeric (总金额)
- creator: user_profile (创建者)
关联关系：一对多关联账单成员表和消费记录表

#### 账单成员表（bill_member）
用途：存储参与账单的所有成员信息。
核心字段：
- bill_id: varchar (关联 -> bill.id)
- user_id: user_profile (参与用户)
关联关系：多对一关联账单表

#### 消费记录表（expense）
用途：存储单笔消费记录信息，包含金额、分类、备注。
核心字段：
- bill_id: varchar (关联 -> bill.id)
- amount: numeric (消费金额)
- category: varchar (消费分类: 餐饮/交通/住宿/娱乐/购物/其他)
- note: text (消费备注)
- payer: user_profile (付款人)
关联关系：多对一关联账单表

## 业务模型

### API 设计

#### 账单列表页 相关

**页面路径**: /

**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 获取用户参与的账单列表 | API | GET /api/bills |
| 创建新账单 | API | POST /api/bills |

**所需 API**:
```typescript
// 获取当前用户参与的所有账单 [领域模型: Bill] [对应页面功能: 账单列表展示]
GET /api/bills?page=1&pageSize=20
Response: {
  items: Array<{
    id: string;
    name: string;
    totalAmount: number;
    memberCount: number;
    createdAt: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

// 创建新AA账单 [领域模型: Bill] [对应页面功能: 创建新账单]
POST /api/bills
Request Body: {
  name: string;
}
Response: {
  id: string;
  name: string;
  totalAmount: number;
}
```

#### 账单详情页 相关

**页面路径**: /bills/:id

**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 获取账单详情 | API | GET /api/bills/:id |
| 获取账单消费记录 | API | GET /api/bills/:id/expenses |
| 获取账单成员列表 | API | GET /api/bills/:id/members |
| 添加成员 | API | POST /api/bills/:id/members |
| 添加消费记录 | API | POST /api/bills/:id/expenses |

**所需 API**:
```typescript
// 获取账单详情信息 [领域模型: Bill] [对应页面功能: 账单信息展示]
GET /api/bills/:id
Response: {
  id: string;
  name: string;
  totalAmount: number;
  creator: string;
  members: Array<{
    userId: string;
    shareAmount: number;
  }>;
}

// 获取账单消费记录列表 [领域模型: Expense] [对应页面功能: 消费记录展示]
GET /api/bills/:id/expenses
Response: {
  items: Array<{
    id: string;
    amount: number;
    category: string;
    note: string;
    payer: string;
    createdAt: string;
  }>;
}

// 获取账单成员列表 [领域模型: BillMember] [对应页面功能: 成员列表展示]
GET /api/bills/:id/members
Response: {
  items: Array<{
    userId: string;
    userName: string;
    shareAmount: number;
  }>;
}

// 添加成员到账单 [领域模型: BillMember] [对应页面功能: 邀请成员]
POST /api/bills/:id/members
Request Body: {
  userId: string;
}
Response: {
  id: string;
  success: boolean;
}

// 添加消费记录到账单 [领域模型: Expense] [对应页面功能: 添加消费记录]
POST /api/bills/:id/expenses
Request Body: {
  amount: number;
  category: string;
  note: string;
  payer: string;
}
Response: {
  id: string;
  success: boolean;
  newTotalAmount: number;
}
```

#### 统计分析页 相关

**页面路径**: /bills/:id/statistics

**功能全景**：
| 功能 | 实现方式 | 说明 |
|------|----------|------|
| 获取分类统计数据 | API | GET /api/bills/:id/statistics |

**所需 API**:
```typescript
// 获取按分类统计的消费数据 [领域模型: Expense, Bill] [对应页面功能: 饼图展示, 分类明细]
GET /api/bills/:id/statistics
Response: {
  categoryStats: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  totalAmount: number;
}