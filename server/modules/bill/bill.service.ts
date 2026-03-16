import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { bill, billMember, expense } from '../../database/schema';
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

@Injectable()
export class BillService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // 获取用户参与的账单列表
  async getBills(userId: string, page = 1, pageSize = 20): Promise<BillListResponse> {
    const offset = (page - 1) * pageSize;

    // 查询用户参与的账单ID列表
    const memberBills = await this.db
      .select({ billId: billMember.billId })
      .from(billMember)
      .where(sql`((user_id).user_id) = ${userId}`);

    const billIds = memberBills.map((m) => m.billId);

    if (billIds.length === 0) {
      return { items: [], total: 0, page, pageSize };
    }

    // 查询账单总数
    const totalResult = await this.db
      .select({ count: count() })
      .from(bill)
      .where(sql`id IN (${sql.join(billIds, sql`, `)})`);

    const total = Number(totalResult[0]?.count || 0);

    // 查询账单列表
    const bills = await this.db
      .select({
        id: bill.id,
        name: bill.name,
        totalAmount: bill.totalAmount,
        creator: sql<string>`((creator).user_id)`,
        createdAt: bill.createdAt,
        updatedAt: bill.updatedAt,
      })
      .from(bill)
      .where(sql`id IN (${sql.join(billIds, sql`, `)})`)
      .orderBy(desc(bill.createdAt))
      .limit(pageSize)
      .offset(offset);

    // 获取每个账单的成员数
    const billsWithMemberCount = await Promise.all(
      bills.map(async (b) => {
        const memberCountResult = await this.db
          .select({ count: count() })
          .from(billMember)
          .where(eq(billMember.billId, b.id));
        return {
          ...b,
          totalAmount: Number(b.totalAmount),
          memberCount: Number(memberCountResult[0]?.count || 0),
        };
      }),
    );

    return {
      items: billsWithMemberCount.map(b => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      })) as Bill[],
      total,
      page,
      pageSize,
    };
  }

  // 创建账单
  async createBill(userId: string, dto: CreateBillRequest): Promise<Bill> {
    const [newBill] = await this.db
      .insert(bill)
      .values({
        name: dto.name,
        totalAmount: '0',
        creator: userId,
      })
      .returning({
        id: bill.id,
        name: bill.name,
        totalAmount: bill.totalAmount,
        creator: sql<string>`((creator).user_id)`,
        createdAt: bill.createdAt,
        updatedAt: bill.updatedAt,
      });

    // 创建者自动成为成员
    await this.db.insert(billMember).values({
      billId: newBill.id,
      userId: userId,
    });

    return {
      ...newBill,
      totalAmount: Number(newBill.totalAmount),
      memberCount: 1,
      createdAt: newBill.createdAt.toISOString(),
      updatedAt: newBill.updatedAt.toISOString(),
    } as Bill;
  }

  // 获取账单详情
  async getBillDetail(userId: string, billId: string): Promise<BillDetail> {
    // 检查用户是否参与该账单
    const isMember = await this.checkIsMember(userId, billId);
    if (!isMember) {
      throw new NotFoundException('账单不存在或无权访问');
    }

    const [billData] = await this.db
      .select({
        id: bill.id,
        name: bill.name,
        totalAmount: bill.totalAmount,
        creator: sql<string>`((creator).user_id)`,
        createdAt: bill.createdAt,
        updatedAt: bill.updatedAt,
      })
      .from(bill)
      .where(eq(bill.id, billId));

    if (!billData) {
      throw new NotFoundException('账单不存在');
    }

    // 获取成员列表
    const members = await this.getBillMembers(billId);

    return {
      ...billData,
      totalAmount: Number(billData.totalAmount),
      members,
      createdAt: billData.createdAt.toISOString(),
      updatedAt: billData.updatedAt.toISOString(),
    } as BillDetail;
  }

  // 获取账单消费记录
  async getBillExpenses(
    userId: string,
    billId: string,
  ): Promise<ExpenseListResponse> {
    // 检查用户是否参与该账单
    const isMember = await this.checkIsMember(userId, billId);
    if (!isMember) {
      throw new NotFoundException('账单不存在或无权访问');
    }

    const expenses = await this.db
      .select({
        id: expense.id,
        billId: expense.billId,
        amount: expense.amount,
        category: expense.category,
        note: expense.note,
        payer: sql<string>`((payer).user_id)`,
        createdAt: expense.createdAt,
      })
      .from(expense)
      .where(eq(expense.billId, billId))
      .orderBy(desc(expense.createdAt));

    return {
      items: expenses.map((e) => ({
        ...e,
        amount: Number(e.amount),
        createdAt: e.createdAt.toISOString(),
      })) as Expense[],
    };
  }

  // 获取账单成员列表
  async getBillMembers(billId: string): Promise<BillMember[]> {
    const members = await this.db
      .select({
        id: billMember.id,
        billId: billMember.billId,
        userId: sql<string>`((user_id).user_id)`,
        createdAt: billMember.createdAt,
      })
      .from(billMember)
      .where(eq(billMember.billId, billId));

    // 计算每个成员的分摊金额
    const totalResult = await this.db
      .select({ total: sql<number>`COALESCE(SUM(${expense.amount}), 0)` })
      .from(expense)
      .where(eq(expense.billId, billId));

    const totalAmount = Number(totalResult[0]?.total || 0);
    const memberCount = members.length;
    const shareAmount = memberCount > 0 ? totalAmount / memberCount : 0;

    return members.map((m) => ({
      ...m,
      shareAmount,
      createdAt: m.createdAt.toISOString(),
    })) as BillMember[];
  }

  // 添加成员到账单
  async addMember(
    userId: string,
    billId: string,
    dto: AddMemberRequest,
  ): Promise<AddMemberResponse> {
    // 检查用户是否参与该账单
    const isMember = await this.checkIsMember(userId, billId);
    if (!isMember) {
      throw new NotFoundException('账单不存在或无权访问');
    }

    // 检查是否已是成员
    const existingMember = await this.db
      .select()
      .from(billMember)
      .where(
        and(
          eq(billMember.billId, billId),
          sql`((user_id).user_id) = ${dto.userId}`,
        ),
      );

    if (existingMember.length > 0) {
      return { id: existingMember[0].id, success: true };
    }

    const [newMember] = await this.db
      .insert(billMember)
      .values({
        billId: billId,
        userId: dto.userId,
      })
      .returning({ id: billMember.id });

    return { id: newMember.id, success: true };
  }

  // 添加消费记录
  async addExpense(
    userId: string,
    billId: string,
    dto: AddExpenseRequest,
  ): Promise<AddExpenseResponse> {
    // 检查用户是否参与该账单
    const isMember = await this.checkIsMember(userId, billId);
    if (!isMember) {
      throw new NotFoundException('账单不存在或无权访问');
    }

    // 创建消费记录
    const [newExpense] = await this.db
      .insert(expense)
      .values({
        billId: billId,
        amount: dto.amount.toString(),
        category: dto.category,
        note: dto.note || null,
        payer: dto.payer,
      })
      .returning({ id: expense.id });

    // 更新账单总金额
    const totalResult = await this.db
      .select({ total: sql<string>`COALESCE(SUM(${expense.amount}), 0)` })
      .from(expense)
      .where(eq(expense.billId, billId));

    const newTotalAmount = totalResult[0]?.total || '0';

    await this.db
      .update(bill)
      .set({ totalAmount: newTotalAmount })
      .where(eq(bill.id, billId));

    return {
      id: newExpense.id,
      success: true,
      newTotalAmount: Number(newTotalAmount),
    };
  }

  // 获取分类统计数据
  async getStatistics(
    userId: string,
    billId: string,
    type: 'category' | 'member' | 'all' = 'all',
  ): Promise<StatisticsData> {
    // 检查用户是否参与该账单
    const isMember = await this.checkIsMember(userId, billId);
    if (!isMember) {
      throw new NotFoundException('账单不存在或无权访问');
    }

    // 获取成员列表
    const members = await this.getBillMembers(billId);
    const memberCount = members.length;

    // 获取所有消费记录
    const expenses = await this.db
      .select({
        amount: expense.amount,
        category: expense.category,
        payer: sql<string>`((payer).user_id)`,
      })
      .from(expense)
      .where(eq(expense.billId, billId));

    const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalExpenses = expenses.length;
    const avgAmount = memberCount > 0 ? totalAmount / memberCount : 0;

    // 分类统计
    let categoryStats: CategoryStat[] = [];
    if (type === 'all' || type === 'category') {
      const categoryData = await this.db
        .select({
          category: expense.category,
          amount: sql<string>`SUM(${expense.amount})`,
        })
        .from(expense)
        .where(eq(expense.billId, billId))
        .groupBy(expense.category);

      categoryStats = categoryData
        .map((item) => ({
          category: item.category as CategoryStat['category'],
          amount: Number(item.amount),
          percentage:
            totalAmount > 0
              ? Math.round((Number(item.amount) / totalAmount) * 100)
              : 0,
        }))
        .sort((a, b) => b.amount - a.amount);
    }

    // 成员统计
    let memberStats: MemberStat[] = [];
    if (type === 'all' || type === 'member') {
      const memberMap = new Map<string, MemberStat>();
      expenses.forEach((e) => {
        const existing = memberMap.get(e.payer);
        if (existing) {
          existing.amount += Number(e.amount);
          existing.expenseCount++;
        } else {
          memberMap.set(e.payer, {
            userId: e.payer,
            amount: Number(e.amount),
            expenseCount: 1,
            percentage: 0,
          });
        }
      });

      memberStats = Array.from(memberMap.values())
        .map((m) => ({
          ...m,
          percentage:
            totalAmount > 0 ? Math.round((m.amount / totalAmount) * 100) : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      // 补充没有消费的成员
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

    return {
      categoryStats,
      memberStats,
      totalAmount,
      totalExpenses,
      memberCount,
      avgAmount,
    };
  }

  // 获取结算数据
  async getSettlement(
    userId: string,
    billId: string,
  ): Promise<SettlementData> {
    // 检查用户是否参与该账单
    const isMember = await this.checkIsMember(userId, billId);
    if (!isMember) {
      throw new NotFoundException('账单不存在或无权访问');
    }

    // 获取成员列表
    const members = await this.getBillMembers(billId);

    // 获取所有消费记录
    const expenses = await this.db
      .select({
        amount: expense.amount,
        payer: sql<string>`((payer).user_id)`,
      })
      .from(expense)
      .where(eq(expense.billId, billId));

    const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const memberCount = members.length;
    const avgAmount = memberCount > 0 ? totalAmount / memberCount : 0;

    // 计算每个人实际支付金额
    const paidMap = new Map<string, number>();
    expenses.forEach((e) => {
      const current = paidMap.get(e.payer) || 0;
      paidMap.set(e.payer, current + Number(e.amount));
    });

    // 构建成员结算明细
    const memberSettlements: MemberSettlement[] = members.map((m) => {
      const paidAmount = paidMap.get(m.userId) || 0;
      return {
        userId: m.userId,
        paidAmount,
        shareAmount: avgAmount,
        balance: Number((paidAmount - avgAmount).toFixed(2)),
      };
    });

    // 计算转账方案
    const transfers = this.calculateTransfers([...memberSettlements]);

    return {
      totalAmount: Number(totalAmount.toFixed(2)),
      memberCount,
      avgAmount: Number(avgAmount.toFixed(2)),
      members: memberSettlements,
      transfers,
    };
  }

  // 计算转账方案（贪心算法）
  private calculateTransfers(members: MemberSettlement[]): TransferItem[] {
    const transfers: TransferItem[] = [];

    // 复制数据，避免修改原数组
    const receivers = members
      .filter((m) => m.balance > 0)
      .sort((a, b) => b.balance - a.balance);
    const payers = members
      .filter((m) => m.balance < 0)
      .sort((a, b) => a.balance - b.balance);

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

  // 检查用户是否是账单成员
  private async checkIsMember(
    userId: string,
    billId: string,
  ): Promise<boolean> {
    const member = await this.db
      .select()
      .from(billMember)
      .where(
        and(
          eq(billMember.billId, billId),
          sql`((user_id).user_id) = ${userId}`,
        ),
      );

    return member.length > 0;
  }
}
