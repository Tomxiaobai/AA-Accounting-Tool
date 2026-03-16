import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  UserPlus,
  Receipt,
  Users,
  PieChart,
  Trash2,
  Copy,
  Share2,
  Calculator,
  ArrowRight,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { resolveAppUrl } from '@lark-apaas/client-toolkit/utils/resolveAppUrl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserDisplay } from '@/components/business-ui/user-display';
import {
  getBillDetail,
  getBillExpenses,
  getBillMembers,
  addExpense,
  joinBill,
  getSettlement,
} from '@/api';
import type {
  BillDetail,
  Expense,
  BillMember,
  ExpenseCategory,
  SettlementData,
} from '@shared/api.interface';
import { EXPENSE_CATEGORIES } from '@shared/api.interface';

const BillDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [bill, setBill] = useState<BillDetail | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<BillMember[]>([]);
  const [loading, setLoading] = useState(true);

  // 弹窗状态
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);

  // 结算数据
  const [settlementData, setSettlementData] = useState<SettlementData | null>(null);
  const [settlementLoading, setSettlementLoading] = useState(false);

  // 表单数据
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('餐饮');
  const [expenseNote, setExpenseNote] = useState('');
  const [selectedPayer, setSelectedPayer] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadBillData();
    }
  }, [id]);

  // 检测邀请参数
  useEffect(() => {
    const isInvite = searchParams.get('invite') === 'true';
    if (isInvite && bill && !loading) {
      // 检查当前用户是否已是成员
      const isMember = members.some((m) => m.userId === bill.creator);
      if (!isMember) {
        setShowJoinConfirm(true);
      }
    }
  }, [searchParams, bill, loading, members]);

  const loadBillData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [billData, expensesData, membersData] = await Promise.all([
        getBillDetail(id),
        getBillExpenses(id),
        getBillMembers(id),
      ]);
      setBill(billData);
      setExpenses(expensesData.items);
      setMembers(membersData.items);
    } catch (error) {
      toast.error('加载账单数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 添加消费记录
  const handleAddExpense = async () => {
    if (!id || !expenseAmount || !selectedPayer) {
      toast.error('请填写完整信息');
      return;
    }

    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('金额必须大于0');
      return;
    }

    try {
      setSubmitting(true);
      await addExpense(id, {
        amount,
        category: expenseCategory,
        note: expenseNote,
        payer: selectedPayer,
      });
      toast.success('添加成功');
      setShowAddExpense(false);
      resetExpenseForm();
      await loadBillData();
    } catch (error) {
      toast.error('添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 加入账单
  const handleJoinBill = async () => {
    if (!id) return;
    try {
      setSubmitting(true);
      await joinBill(id);
      toast.success('加入成功');
      setShowJoinConfirm(false);
      await loadBillData();
    } catch (error) {
      toast.error('加入失败，可能已是成员');
    } finally {
      setSubmitting(false);
    }
  };

  // 加载结算数据
  const loadSettlement = async () => {
    if (!id) return;
    try {
      setSettlementLoading(true);
      const data = await getSettlement(id);
      setSettlementData(data);
      setShowSettlement(true);
    } catch (error) {
      toast.error('加载结算数据失败');
    } finally {
      setSettlementLoading(false);
    }
  };

  // 复制分享链接
  const handleCopyLink = () => {
    const shareUrl = resolveAppUrl(`/bills/${id}?invite=true`);
    navigator.clipboard.writeText(shareUrl);
    toast.success('链接已复制');
  };

  const resetExpenseForm = () => {
    setExpenseAmount('');
    setExpenseCategory('餐饮');
    setExpenseNote('');
    setSelectedPayer(null);
  };

  // 格式化金额
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">账单不存在</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          返回首页
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* 顶部导航 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center card-shadow hover:card-shadow-hover transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight flex-1 truncate">
          {bill.name}
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/bills/${id}/statistics`)}
          className="rounded-full"
        >
          <PieChart className="w-4 h-4 mr-1" />
          统计
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={loadSettlement}
          disabled={settlementLoading}
          className="rounded-full"
        >
          <Calculator className="w-4 h-4 mr-1" />
          {settlementLoading ? '计算中...' : '结算'}
        </Button>
      </div>

      {/* 账单信息区 */}
      <div className="bg-card rounded-3xl p-6 card-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">
            <Receipt className="w-6 h-6 text-primary" />
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">总金额</p>
            <p className="text-2xl font-bold font-money text-primary">
              {formatAmount(bill.totalAmount || 0)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{members.length} 人参与</span>
          <span className="mx-2">·</span>
          <span>人均 {formatAmount(members.length > 0 ? (bill.totalAmount || 0) / members.length : 0)}</span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => setShowAddExpense(true)}
          className="rounded-2xl h-14 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          添加消费
        </Button>
        <Button
          onClick={() => setShowShare(true)}
          variant="outline"
          className="rounded-2xl h-14 border-2"
        >
          <Share2 className="w-5 h-5 mr-2" />
          分享邀请
        </Button>
      </div>

      {/* Tab内容 */}
      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="w-full rounded-2xl bg-muted p-1 mb-4">
          <TabsTrigger value="expenses" className="flex-1 rounded-xl">
            消费记录
          </TabsTrigger>
          <TabsTrigger value="members" className="flex-1 rounded-xl">
            参与成员
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4 mt-0">
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-primary/50" />
              </div>
              <p className="text-muted-foreground">暂无消费记录</p>
              <Button
                onClick={() => setShowAddExpense(true)}
                variant="ghost"
                className="mt-2 text-primary"
              >
                添加第一笔消费
              </Button>
            </div>
          ) : (
            expenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-card rounded-2xl p-4 card-shadow flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                    <span className="text-lg">{getCategoryEmoji(expense.category)}</span>
                  </div>
                  <div>
                    <p className="font-medium">{expense.category}</p>
                    {expense.note && (
                      <p className="text-xs text-muted-foreground">{expense.note}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <UserDisplay value={[expense.payer]} showLabel={false} size="small" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(expense.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="font-semibold text-lg font-money">
                  {formatAmount(expense.amount)}
                </p>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-4 mt-0">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-card rounded-2xl p-4 card-shadow flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <UserDisplay value={[member.userId]} showLabel={false} size="medium" />
                <div>
                  <UserDisplay value={[member.userId]} showLabel={true} size="small" />
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold font-money">
                  {formatAmount(member.shareAmount)}
                </p>
                <p className="text-xs text-muted-foreground">应付</p>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* 添加消费弹窗 */}
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent className="sm:max-w-[340px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">添加消费</DialogTitle>
            <DialogDescription>记录一笔新的消费</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>金额</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="rounded-xl h-12 text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>分类</Label>
              <Select
                value={expenseCategory}
                onValueChange={(v) => setExpenseCategory(v as ExpenseCategory)}
              >
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <span className="mr-2">{getCategoryEmoji(cat)}</span>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>备注（可选）</Label>
              <Input
                placeholder="例如：午餐"
                value={expenseNote}
                onChange={(e) => setExpenseNote(e.target.value)}
                className="rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label>付款人</Label>
              <Select
                value={selectedPayer || ''}
                onValueChange={(v) => setSelectedPayer(v)}
              >
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="选择付款人" />
                </SelectTrigger>
                <SelectContent>
                  {members.length === 0 ? (
                    <SelectItem value="" disabled>
                      暂无成员，请先邀请成员
                    </SelectItem>
                  ) : (
                    members.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        <div className="flex items-center gap-2">
                          <UserDisplay value={[member.userId]} showLabel={true} size="small" />
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddExpense(false);
                resetExpenseForm();
              }}
              className="flex-1 rounded-xl h-12"
            >
              取消
            </Button>
            <Button
              onClick={handleAddExpense}
              disabled={submitting || !expenseAmount || !selectedPayer}
              className="flex-1 rounded-xl h-12 bg-primary hover:bg-primary/90"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                '确认'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 分享邀请弹窗 */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="sm:max-w-[320px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">分享邀请</DialogTitle>
            <DialogDescription>扫码或复制链接邀请好友</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {/* 二维码 */}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-2xl">
                <QRCodeCanvas
                  value={resolveAppUrl(`/bills/${id}?invite=true`)}
                  size={180}
                  level="M"
                />
              </div>
            </div>
            {/* 复制链接按钮 */}
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="w-full rounded-xl h-12"
            >
              <Copy className="w-4 h-4 mr-2" />
              复制邀请链接
            </Button>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowShare(false)}
              className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90"
            >
              完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 加入账单确认弹窗 */}
      <Dialog open={showJoinConfirm} onOpenChange={setShowJoinConfirm}>
        <DialogContent className="sm:max-w-[320px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">加入账单</DialogTitle>
            <DialogDescription>确认加入「{bill?.name}」账单？</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-accent rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{bill?.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                当前 {members.length} 人参与
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowJoinConfirm(false)}
              className="flex-1 rounded-xl h-12"
            >
              取消
            </Button>
            <Button
              onClick={handleJoinBill}
              disabled={submitting}
              className="flex-1 rounded-xl h-12 bg-primary hover:bg-primary/90"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                '确认加入'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 结算弹窗 */}
      <Dialog open={showSettlement} onOpenChange={setShowSettlement}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 max-h-[80vh] overflow-hidden">
          <div className="p-6 pb-4 border-b border-border/50">
            <DialogTitle className="text-xl">AA结算</DialogTitle>
            <DialogDescription className="mt-1">
              自动计算转账方案
            </DialogDescription>
          </div>
          <div className="overflow-y-auto p-6 space-y-6 max-h-[60vh]">
            {settlementData ? (
              <>
                {/* 总览 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-accent/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">总费用</p>
                    <p className="font-bold font-money">
                      {formatAmount(settlementData.totalAmount)}
                    </p>
                  </div>
                  <div className="bg-accent/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">人均</p>
                    <p className="font-bold font-money">
                      {formatAmount(settlementData.avgAmount)}
                    </p>
                  </div>
                  <div className="bg-accent/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">成员</p>
                    <p className="font-bold">{settlementData.memberCount}人</p>
                  </div>
                </div>

                {/* 成员明细 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">成员明细</h3>
                  <div className="space-y-2">
                    {settlementData.members.map((m) => (
                      <div
                        key={m.userId}
                        className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                      >
                        <UserDisplay value={[m.userId]} showLabel={true} size="small" />
                        <div className="text-right">
                          <p className="font-medium font-money text-sm">
                            支付 {formatAmount(m.paidAmount)}
                          </p>
                          <p
                            className={`text-xs ${
                              m.balance >= 0 ? 'text-green-600' : 'text-red-500'
                            }`}
                          >
                            {m.balance >= 0
                              ? `应收 ${formatAmount(m.balance)}`
                              : `应付 ${formatAmount(Math.abs(m.balance))}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 转账方案 */}
                {settlementData.transfers.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      转账方案
                    </h3>
                    <div className="space-y-2">
                      {settlementData.transfers.map((t, idx) => (
                        <div
                          key={idx}
                          className="bg-accent/50 rounded-xl p-3 flex items-center justify-between"
                        >
                          <UserDisplay
                            value={[t.fromUserId]}
                            showLabel={true}
                            size="small"
                          />
                          <div className="flex items-center gap-2 text-primary">
                            <span className="font-money font-semibold text-sm">
                              {formatAmount(t.amount)}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                          <UserDisplay
                            value={[t.toUserId]}
                            showLabel={true}
                            size="small"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {settlementData.transfers.length === 0 && (
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-green-700 text-sm">
                      完美平衡！无需转账
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            )}
          </div>
          <div className="p-6 pt-4 border-t border-border/50">
            <Button
              onClick={() => setShowSettlement(false)}
              className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90"
            >
              完成
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// 获取分类emoji
function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    '餐饮': '🍽️',
    '交通': '🚗',
    '住宿': '🏨',
    '娱乐': '🎮',
    '购物': '🛍️',
    '其他': '📦',
  };
  return emojiMap[category] || '📦';
}

export default BillDetailPage;
