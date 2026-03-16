import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  BillListResponse,
  Bill,
  CreateBillRequest,
  BillDetail,
  ExpenseListResponse,
  MemberListResponse,
  AddMemberRequest,
  AddMemberResponse,
  AddExpenseRequest,
  AddExpenseResponse,
  StatisticsData,
  JoinBillResponse,
  MemberStat,
  SettlementData,
} from '@shared/api.interface';

// 获取账单列表
export async function getBills(page = 1, pageSize = 20): Promise<BillListResponse> {
  try {
    const response = await axiosForBackend({
      url: `/api/bills?page=${page}&pageSize=${pageSize}`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取账单列表失败', error);
    throw error;
  }
}

// 创建账单
export async function createBill(data: CreateBillRequest): Promise<Bill> {
  try {
    const response = await axiosForBackend({
      url: '/api/bills',
      method: 'POST',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('创建账单失败', error);
    throw error;
  }
}

// 获取账单详情
export async function getBillDetail(billId: string): Promise<BillDetail> {
  try {
    const response = await axiosForBackend({
      url: `/api/bills/${billId}`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取账单详情失败', error);
    throw error;
  }
}

// 获取账单消费记录
export async function getBillExpenses(billId: string): Promise<ExpenseListResponse> {
  try {
    const response = await axiosForBackend({
      url: `/api/bills/${billId}/expenses`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取消费记录失败', error);
    throw error;
  }
}

// 获取账单成员列表
export async function getBillMembers(billId: string): Promise<MemberListResponse> {
  try {
    const response = await axiosForBackend({
      url: `/api/bills/${billId}/members`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取成员列表失败', error);
    throw error;
  }
}

// 添加成员
export async function addMember(billId: string, data: AddMemberRequest): Promise<AddMemberResponse> {
  try {
    const response = await axiosForBackend({
      url: `/api/bills/${billId}/members`,
      method: 'POST',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('添加成员失败', error);
    throw error;
  }
}

// 添加消费记录
export async function addExpense(billId: string, data: AddExpenseRequest): Promise<AddExpenseResponse> {
  try {
    const response = await axiosForBackend({
      url: `/api/bills/${billId}/expenses`,
      method: 'POST',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('添加消费记录失败', error);
    throw error;
  }
}

// 获取统计数据
export async function getStatistics(
  billId: string,
  type?: 'category' | 'member' | 'all',
): Promise<StatisticsData> {
  try {
    const url = type
      ? `/api/bills/${billId}/statistics?type=${type}`
      : `/api/bills/${billId}/statistics`;
    const response = await axiosForBackend({
      url,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取统计数据失败', error);
    throw error;
  }
}

// 通过邀请链接加入账单
export async function joinBill(billId: string): Promise<JoinBillResponse> {
  try {
    const response = await axiosForBackend({
      url: `/api/bills/join/${billId}`,
      method: 'POST',
    });
    return response.data;
  } catch (error) {
    logger.error('加入账单失败', error);
    throw error;
  }
}

// 获取结算数据
export async function getSettlement(billId: string): Promise<SettlementData> {
  try {
    const response = await axiosForBackend({
      url: `/api/bills/${billId}/settlement`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取结算数据失败', error);
    throw error;
  }
}
