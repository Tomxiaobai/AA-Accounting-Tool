import axios from 'axios';
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
  SettlementData,
} from '@shared/api.interface';

const api = axios.create({
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export async function getBills(page = 1, pageSize = 20): Promise<BillListResponse> {
  const response = await api.get(`/api/bills?page=${page}&pageSize=${pageSize}`);
  return response.data;
}

export async function createBill(data: CreateBillRequest): Promise<Bill> {
  const response = await api.post('/api/bills', data);
  return response.data;
}

export async function getBillDetail(billId: string): Promise<BillDetail> {
  const response = await api.get(`/api/bills/${billId}`);
  return response.data;
}

export async function getBillExpenses(billId: string): Promise<ExpenseListResponse> {
  const response = await api.get(`/api/bills/${billId}/expenses`);
  return response.data;
}

export async function getBillMembers(billId: string): Promise<MemberListResponse> {
  const response = await api.get(`/api/bills/${billId}/members`);
  return response.data;
}

export async function addMember(billId: string, data: AddMemberRequest): Promise<AddMemberResponse> {
  const response = await api.post(`/api/bills/${billId}/members`, data);
  return response.data;
}

export async function addExpense(billId: string, data: AddExpenseRequest): Promise<AddExpenseResponse> {
  const response = await api.post(`/api/bills/${billId}/expenses`, data);
  return response.data;
}

export async function getStatistics(
  billId: string,
  type?: 'category' | 'member' | 'all',
): Promise<StatisticsData> {
  const url = type
    ? `/api/bills/${billId}/statistics?type=${type}`
    : `/api/bills/${billId}/statistics`;
  const response = await api.get(url);
  return response.data;
}

export async function joinBill(billId: string): Promise<JoinBillResponse> {
  const response = await api.post(`/api/bills/join/${billId}`);
  return response.data;
}

export async function getSettlement(billId: string): Promise<SettlementData> {
  const response = await api.get(`/api/bills/${billId}/settlement`);
  return response.data;
}
