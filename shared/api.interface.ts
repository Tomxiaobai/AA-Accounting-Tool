/* AA记账应用前后端共享类型定义 */

// ==================== 基础类型 ====================

export type ExpenseCategory = '餐饮' | '交通' | '住宿' | '娱乐' | '购物' | '其他';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = ['餐饮', '交通', '住宿', '娱乐', '购物', '其他'];

// ==================== 账单类型 ====================

export interface Bill {
  id: string;
  name: string;
  totalAmount: number;
  creator: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BillDetail extends Bill {
  members: BillMember[];
}

// ==================== 成员类型 ====================

export interface BillMember {
  id: string;
  billId: string;
  userId: string;
  userName?: string;
  shareAmount: number;
  createdAt: string;
}

// ==================== 消费记录类型 ====================

export interface Expense {
  id: string;
  billId: string;
  amount: number;
  category: ExpenseCategory;
  note: string | null;
  payer: string;
  payerName?: string;
  createdAt: string;
}

// ==================== 统计类型 ====================

export interface CategoryStat {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
}

export interface MemberStat {
  userId: string;
  amount: number;
  percentage: number;
  expenseCount: number;
}

export interface StatisticsData {
  categoryStats: CategoryStat[];
  memberStats: MemberStat[];
  totalAmount: number;
  totalExpenses: number;
  memberCount: number;
  avgAmount: number;
}

// ==================== 请求类型 ====================

export interface CreateBillRequest {
  name: string;
}

export interface AddMemberRequest {
  userId: string;
}

export interface AddExpenseRequest {
  amount: number;
  category: ExpenseCategory;
  note?: string;
  payer: string;
}

// ==================== 响应类型 ====================

export interface BillListResponse {
  items: Bill[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ExpenseListResponse {
  items: Expense[];
}

export interface MemberListResponse {
  items: BillMember[];
}

export interface AddMemberResponse {
  id: string;
  success: boolean;
}

export interface AddExpenseResponse {
  id: string;
  success: boolean;
  newTotalAmount: number;
}

// 通过邀请链接加入账单响应
export interface JoinBillResponse {
  id: string;
  success: boolean;
  isNewMember: boolean;
}

// ==================== 结算类型 ====================

// 个人结算明细
export interface MemberSettlement {
  userId: string;
  paidAmount: number;
  shareAmount: number;
  balance: number;
}

// 转账方案
export interface TransferItem {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

// 结算数据
export interface SettlementData {
  totalAmount: number;
  memberCount: number;
  avgAmount: number;
  members: MemberSettlement[];
  transfers: TransferItem[];
}
