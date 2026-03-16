import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Receipt, Users } from 'lucide-react';
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
import { getBills, createBill } from '@/api';
import type { Bill } from '@shared/api.interface';

const BillListPage = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBillName, setNewBillName] = useState('');
  const [creating, setCreating] = useState(false);

  // 加载账单列表
  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      setLoading(true);
      const response = await getBills();
      setBills(response.items);
    } catch (error) {
      toast.error('加载账单列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建账单
  const handleCreateBill = async () => {
    if (!newBillName.trim()) {
      toast.error('请输入账单名称');
      return;
    }

    try {
      setCreating(true);
      const newBill = await createBill({ name: newBillName.trim() });
      toast.success('创建成功');
      setShowCreateDialog(false);
      setNewBillName('');
      navigate(`/bills/${newBill.id}`);
    } catch (error) {
      toast.error('创建账单失败');
    } finally {
      setCreating(false);
    }
  };

  // 格式化金额
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* 顶部操作区 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">我的账单</h1>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="rounded-full px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          新建账单
        </Button>
      </div>

      {/* 账单列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : bills.length === 0 ? (
        // 空状态
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-accent flex items-center justify-center mb-6">
            <Receipt className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">暂无账单</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-[200px]">
            创建一个新的AA账单，开始记录多人消费吧
          </p>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="rounded-full px-6 bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建首个账单
          </Button>
        </div>
      ) : (
        // 账单列表
        <div className="space-y-4">
          {bills.map((bill, index) => (
            <div
              key={bill.id}
              onClick={() => navigate(`/bills/${bill.id}`)}
              className="bg-card rounded-3xl p-5 card-shadow hover:card-shadow-hover transition-all cursor-pointer active:scale-[0.98]"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{bill.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(bill.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-primary" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">总金额</p>
                    <p className="font-semibold text-lg font-money">
                      {formatAmount(bill.totalAmount || 0)}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {bill.memberCount || 0} 人参与
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 创建账单弹窗 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[320px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">创建账单</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              输入账单名称开始AA记账
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">账单名称</Label>
              <Input
                id="name"
                placeholder="例如：周末聚餐"
                value={newBillName}
                onChange={(e) => setNewBillName(e.target.value)}
                className="rounded-xl h-12"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateBill();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setNewBillName('');
              }}
              className="flex-1 rounded-xl h-12"
            >
              取消
            </Button>
            <Button
              onClick={handleCreateBill}
              disabled={creating || !newBillName.trim()}
              className="flex-1 rounded-xl h-12 bg-primary hover:bg-primary/90"
            >
              {creating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                '创建'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillListPage;
