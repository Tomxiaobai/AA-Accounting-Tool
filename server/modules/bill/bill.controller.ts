import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { BillService } from './bill.service';
import type {
  CreateBillRequest,
  AddMemberRequest,
  AddExpenseRequest,
  BillListResponse,
  Bill,
  BillDetail,
  ExpenseListResponse,
  MemberListResponse,
  AddMemberResponse,
  AddExpenseResponse,
  StatisticsData,
  JoinBillResponse,
  SettlementData,
} from '@shared/api.interface';

@Controller('api/bills')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @Get()
  async getBills(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<BillListResponse> {
    const { userId } = req.userContext;
    return this.billService.getBills(
      userId,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }

  @Post()
  async createBill(
    @Req() req: Request,
    @Body() dto: CreateBillRequest,
  ): Promise<Bill> {
    const { userId } = req.userContext;
    return this.billService.createBill(userId, dto);
  }

  @Get(':id')
  async getBillDetail(
    @Req() req: Request,
    @Param('id') billId: string,
  ): Promise<BillDetail> {
    const { userId } = req.userContext;
    return this.billService.getBillDetail(userId, billId);
  }

  @Get(':id/expenses')
  async getBillExpenses(
    @Req() req: Request,
    @Param('id') billId: string,
  ): Promise<ExpenseListResponse> {
    const { userId } = req.userContext;
    return this.billService.getBillExpenses(userId, billId);
  }

  @Get(':id/members')
  async getBillMembers(
    @Req() req: Request,
    @Param('id') billId: string,
  ): Promise<MemberListResponse> {
    const { userId } = req.userContext;
    const items = await this.billService.getBillMembers(billId);
    return { items };
  }

  @Post(':id/members')
  async addMember(
    @Req() req: Request,
    @Param('id') billId: string,
    @Body() dto: AddMemberRequest,
  ): Promise<AddMemberResponse> {
    const { userId } = req.userContext;
    return this.billService.addMember(userId, billId, dto);
  }

  @Post(':id/expenses')
  async addExpense(
    @Req() req: Request,
    @Param('id') billId: string,
    @Body() dto: AddExpenseRequest,
  ): Promise<AddExpenseResponse> {
    const { userId } = req.userContext;
    return this.billService.addExpense(userId, billId, dto);
  }

  @Get(':id/statistics')
  async getStatistics(
    @Req() req: Request,
    @Param('id') billId: string,
    @Query('type') type?: 'category' | 'member' | 'all',
  ): Promise<StatisticsData> {
    const { userId } = req.userContext;
    return this.billService.getStatistics(userId, billId, type || 'all');
  }

  @Post('join/:billId')
  async joinByInvite(
    @Req() req: Request,
    @Param('billId') billId: string,
  ): Promise<JoinBillResponse> {
    const { userId } = req.userContext;
    const result = await this.billService.addMember(userId, billId, { userId });
    return { ...result, isNewMember: true };
  }

  @Get(':id/settlement')
  async getSettlement(
    @Req() req: Request,
    @Param('id') billId: string,
  ): Promise<SettlementData> {
    const { userId } = req.userContext;
    return this.billService.getSettlement(userId, billId);
  }
}
