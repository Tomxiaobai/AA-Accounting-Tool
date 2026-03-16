import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateBillRequest,
  AddMemberRequest,
  AddExpenseRequest,
  BillListResponse,
  Bill,
  BillDetail,
  Expense,
  BillMember,
  StatisticsData,
  CategoryStat,
  ExpenseListResponse,
  MemberListResponse,
  AddMemberResponse,
  AddExpenseResponse,
  MemberStat,
  SettlementData,
  MemberSettlement,
  TransferItem,
} from '@shared/api.interface';

// In-memory data store
interface BillRecord {
  id: string;
  name: string;
  totalAmount: number;
  creator: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MemberRecord {
  id: string;
  billId: string;
  userId: string;
  createdAt: Date;
}

interface ExpenseRecord {
  id: string;
  billId: string;
  amount: number;
  category: string;
  note: string | null;
  payer: string;
  createdAt: Date;
}

@Injectable()
export class BillService {
  private bills: BillRecord[] = [];
  private members: MemberRecord[] = [];
  private expenses: ExpenseRecord[] = [];

  private generateId(): string {
    // Simple UUID-like ID generation without external dependency
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Get bills for a user
  async getBills(userId: string, page = 1, pageSize = 20): Promise<BillListResponse> {
    const offset = (page - 1) * pageSize;

    // Find bills where user is a member
    const memberBillIds = this.members
      .filter((m) => m.userId === userId)
      .map((m) => m.billId);

    const userBills = this.bills
      .filter((b) => memberBillIds.includes(b.id))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = userBills.length;
    const paginatedBills = userBills.slice(offset, offset + pageSize);

    const items: Bill[] = paginatedBills.map((b) => ({
      ...b,
      memberCount: this.members.filter((m) => m.billId === b.id).length,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    }));

    return { items, total, page, pageSize };
  }

  // Create a bill
  async createBill(userId: string, dto: CreateBillRequest): Promise<Bill> {
    const now = new Date();
    const newBill: BillRecord = {
      id: this.generateId(),
      name: dto.name,
      totalAmount: 0,
      creator: userId,
      createdAt: now,
      updatedAt: now,
    };

    this.bills.push(newBill);

    // Creator auto-joins as member
    this.members.push({
      id: this.generateId(),
      billId: newBill.id,
      userId: userId,
      createdAt: now,
    });

    return {
      ...newBill,
      memberCount: 1,
      createdAt: newBill.createdAt.toISOString(),
      updatedAt: newBill.updatedAt.toISOString(),
    };
  }

  // Get bill detail
  async getBillDetail(userId: string, billId: string): Promise<BillDetail> {
    const isMember = this.checkIsMember(userId, billId);
    if (!isMember) {
      throw new NotFoundException('账单不存在或无权访问');
    }

    const billData = this.bills.find((b) => b.id === billId);
    if (!billData) {
      throw new NotFoundException('账单不存在');
    }

    const members = await this.getBillMembers(billId);

    return {
      ...billData,
      members,
      createdAt: billData.createdAt.toISOString(),
      updatedAt: billData.updatedAt.toISOString(),
    };
  }

  // Get bill expenses
  async getBillExpenses(userId: string, billId: string): Promise<ExpenseListResponse> {
    const isMember = this.checkIsMember(userId, billId);
    if (!isMember) {
      throw new NotFoundException('账单不存在或无权访问');
    }

    const items: Expense[] = this.expenses
      .filter((e) => e.billId === billId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((e) => ({
        ...e,
        category: e.category as Expense['category'],
        createdAt: e.createdAt.toISOString(),
      }));

    return { items };
  }

  // Get bill members
  async getBillMembers(billId: string): Promise<BillMember[]> {
    const billMembers = this.members.filter((m) => m.billId === billId);

    const totalAmount = this.expenses
      .filter((e) => e.billId === billId)
      .reduce((sum, e) => sum + e.amount, 0);

    const memberCount = billMembers.length;
    const shareAmount = memberCount > 0 ? totalAmount / memberCount : 0;

    return billMembers.map((m) => ({
      ...m,
      shareAmount,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  // Add member to bill
  async addMember(userId: string, billId: string, dto: AddMemberRequest): Promise<AddMemberResponse> {
    const isMember = this.checkIsMember(userId, billId);
    if (!isMember) {
      throw new NotFoundException('账单不存在或无权访问');
    }

    // Check if already a member
    const existing = this.members.find(
      (m) => m.billId === billId && m.userId === dto.userId,
    );
    if (existing) {
      return { id: existing.id, success: true };
    }

    const newMember: MemberRecord = {
      id: this.generateId(),
      billId,
      userId: dto.userId,
      createdAt: new Date(),
    };
    this.members.push(newMember);

    return { id: newMember.id, success: true };
  }

  // Add expense
  async addExpense(userId: string, billId: string, dto: AddExpenseRequest): Promise<AddExpenseResponse> {
    const isMember = this.checkIsMember(userId, billId);
    if (!isMember) {
      throw new NotFoundException('账单不存在或无权访问');
    }

    const newExpense: ExpenseRecord = {
      id: this.generateId(),
      billId,
      amount: dto.amount,
      category: dto.category,
      note: dto.note || null,
      payer: dto.payer,
      createdAt: new Date(),
    };
    this.expenses.push(newExpense);

    // Update bill total
    const newTotal = this.expenses
      .filter((e) => e.billId === billId)
      .reduce((sum, e) => sum + e.amount, 0);

    const billRecord = this.bills.find((b) => b.id === billId);
    if (billRecord) {
      billRecord.totalAmount = newTotal;
      billRecord.updatedAt = new Date();
    }

    return {
      id: newExpense.id,
      success: true,
      newTotalAmount: newTotal,
    };
  }

  // Get statistics
  async getStatistics(
    userId: string,
    billId: string,
    type: 'category' | 'member' | 'all' = 'all',
  ): Promise<StatisticsData> {
    const isMember = this.checkIsMember(userId, billId);
    if (!isMember) {
      throw new NotFoundException('账单不存在或无权访问');
    }

    const members = await this.getBillMembers(billId);
    const memberCount = members.length;
    const billExpenses = this.expenses.filter((e) => e.billId === billId);
    const totalAmount = billExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = billExpenses.length;
    const avgAmount = memberCount > 0 ? totalAmount / memberCount : 0;

    let categoryStats: CategoryStat[] = [];
    if (type === 'all' || type === 'category') {
      const categoryMap = new Map<string, number>();
      billExpenses.forEach((e) => {
        categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + e.amount);
      });
      categoryStats = Array.from(categoryMap.entries())
        .map(([category, amount]) => ({
          category: category as CategoryStat['category'],
          amount,
          percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0,
        }))
        .sort((a, b) => b.amount - a.amount);
    }

    let memberStats: MemberStat[] = [];
    if (type === 'all' || type === 'member') {
      const memberMap = new Map<string, MemberStat>();
      billExpenses.forEach((e) => {
        const existing = memberMap.get(e.payer);
        if (existing) {
          existing.amount += e.amount;
          existing.expenseCount++;
        } else {
          memberMap.set(e.payer, {
            userId: e.payer,
            amount: e.amount,
            expenseCount: 1,
            percentage: 0,
          });
        }
      });

      memberStats = Array.from(memberMap.values())
        .map((m) => ({
          ...m,
          percentage: totalAmount > 0 ? Math.round((m.amount / totalAmount) * 100) : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      members.forEach((member) => {
        if (!memberMap.has(member.userId)) {
          memberStats.push({
            userId: member.userId,
            amount: 0,
            percentage: 0,
            expenseCount: 0,
          });
        }
      });
    }

    return { categoryStats, memberStats, totalAmount, totalExpenses, memberCount, avgAmount };
  }

  // Get settlement
  async getSettlement(userId: string, billId: string): Promise<SettlementData> {
    const isMember = this.checkIsMember(userId, billId);
    if (!isMember) {
      throw new NotFoundException('账单不存在或无权访问');
    }

    const members = await this.getBillMembers(billId);
    const billExpenses = this.expenses.filter((e) => e.billId === billId);
    const totalAmount = billExpenses.reduce((sum, e) => sum + e.amount, 0);
    const memberCount = members.length;
    const avgAmount = memberCount > 0 ? totalAmount / memberCount : 0;

    const paidMap = new Map<string, number>();
    billExpenses.forEach((e) => {
      paidMap.set(e.payer, (paidMap.get(e.payer) || 0) + e.amount);
    });

    const memberSettlements: MemberSettlement[] = members.map((m) => {
      const paidAmount = paidMap.get(m.userId) || 0;
      return {
        userId: m.userId,
        paidAmount,
        shareAmount: avgAmount,
        balance: Number((paidAmount - avgAmount).toFixed(2)),
      };
    });

    const transfers = this.calculateTransfers([...memberSettlements]);

    return {
      totalAmount: Number(totalAmount.toFixed(2)),
      memberCount,
      avgAmount: Number(avgAmount.toFixed(2)),
      members: memberSettlements,
      transfers,
    };
  }

  private calculateTransfers(members: MemberSettlement[]): TransferItem[] {
    const transfers: TransferItem[] = [];
    const receivers = members.filter((m) => m.balance > 0).sort((a, b) => b.balance - a.balance);
    const payers = members.filter((m) => m.balance < 0).sort((a, b) => a.balance - b.balance);

    let i = 0;
    let j = 0;
    while (i < receivers.length && j < payers.length) {
      const receiver = receivers[i];
      const payer = payers[j];
      const amount = Math.min(receiver.balance, Math.abs(payer.balance));

      if (amount > 0.01) {
        transfers.push({
          fromUserId: payer.userId,
          toUserId: receiver.userId,
          amount: Number(amount.toFixed(2)),
        });
      }

      receiver.balance = Number((receiver.balance - amount).toFixed(2));
      payer.balance = Number((payer.balance + amount).toFixed(2));

      if (receiver.balance <= 0.01) i++;
      if (payer.balance >= -0.01) j++;
    }

    return transfers;
  }

  private checkIsMember(userId: string, billId: string): boolean {
    return this.members.some((m) => m.billId === billId && m.userId === userId);
  }
}
