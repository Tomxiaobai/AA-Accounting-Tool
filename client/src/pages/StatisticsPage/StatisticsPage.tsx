import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PieChart, Users, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserDisplay } from '@/components/business-ui/user-display';
import { getStatistics } from '@/api';
import type { StatisticsData, CategoryStat, MemberStat } from '@shared/api.interface';

const StatisticsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'member'>('overview');

  useEffect(() => {
    if (id) {
      loadStatistics();
    }
  }, [id]);

  const loadStatistics = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const stats = await getStatistics(id, 'all');
      setData(stats);
    } catch (error) {
      toast.error('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'overview' | 'member');
  };

  // 格式化金额
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // 饼图配置
  const getPieOption = (
    stats: CategoryStat[] | MemberStat[],
    type: 'category' | 'member' = 'category',
  ): EChartsOption => {
    const colors = ['#2DD4BF', '#3B82F6', '#FBBF24', '#A78BFA', '#F87171', '#9CA3AF', '#EC4899', '#8B5CF6'];

    const data = stats.map((item, index) => ({
      name: type === 'category' ? (item as CategoryStat).category : (item as MemberStat).userId,
      value: item.amount,
      itemStyle: {
        color: colors[index % colors.length],
      },
    }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${type === 'member' ? '成员' : params.name}<br/>金额: ¥${params.value.toFixed(2)}<br/>占比: ${params.percent}%`;
        },
      },
      legend: {
        type: 'scroll',
        bottom: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: {
          fontSize: 12,
        },
        formatter: (name: string) => {
          if (type === 'member') {
            return name.slice(0, 8) + '...';
          }
          return name;
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: false,
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
            },
          },
          labelLine: {
            show: false,
          },
          data,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const hasData = data && data.totalAmount > 0 && data.categoryStats.length > 0;

  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center card-shadow hover:card-shadow-hover transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">费用分析</h1>
      </div>

      {/* 总览卡片 */}
      <div className="bg-card rounded-3xl p-6 card-shadow">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">总支出</p>
            <p className="text-2xl font-bold font-money text-primary">
              {formatAmount(data?.totalAmount || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">人均消费</p>
            <p className="text-2xl font-bold font-money">
              {formatAmount(data?.avgAmount || 0)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {data?.memberCount || 0} 人参与
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {data?.totalExpenses || 0} 笔消费
            </span>
          </div>
        </div>
      </div>

      {!hasData ? (
        // 空状态
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-accent flex items-center justify-center mx-auto mb-6">
            <PieChart className="w-10 h-10 text-primary/50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">暂无数据</h3>
          <p className="text-muted-foreground text-sm mb-6">
            该账单还没有消费记录
          </p>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="rounded-full px-6"
          >
            返回账单
          </Button>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full rounded-2xl bg-muted p-1 mb-4">
            <TabsTrigger value="overview" className="flex-1 rounded-xl">
              全局统计
            </TabsTrigger>
            <TabsTrigger value="member" className="flex-1 rounded-xl">
              成员统计
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* 分类占比饼图 */}
            <div className="bg-card rounded-3xl p-4 card-shadow">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 px-2">
                分类占比
              </h3>
              <ReactECharts
                option={getPieOption(data.categoryStats, 'category')}
                theme="ud"
                className="h-[300px]"
              />
            </div>

            {/* 分类明细 */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground px-2">
                分类明细
              </h3>
              {data.categoryStats.map((stat, index) => (
                <CategoryItem
                  key={stat.category}
                  stat={stat}
                  total={data.totalAmount}
                  index={index}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="member" className="space-y-6 mt-0">
            {/* 成员消费占比饼图 */}
            <div className="bg-card rounded-3xl p-4 card-shadow">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 px-2">
                成员消费占比
              </h3>
              <ReactECharts
                option={getPieOption(data.memberStats, 'member')}
                theme="ud"
                className="h-[300px]"
              />
            </div>

            {/* 成员消费明细 */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground px-2">
                成员消费明细
              </h3>
              {data.memberStats?.map((stat, index) => (
                <MemberItem
                  key={stat.userId}
                  stat={stat}
                  total={data.totalAmount}
                  index={index}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

// 分类明细项组件
const CategoryItem = ({
  stat,
  total,
  index,
}: {
  stat: CategoryStat;
  total: number;
  index: number;
}) => {
  const colors = [
    { bg: 'bg-[#2DD4BF]', light: 'bg-[#2DD4BF]/10' },
    { bg: 'bg-[#3B82F6]', light: 'bg-[#3B82F6]/10' },
    { bg: 'bg-[#FBBF24]', light: 'bg-[#FBBF24]/10' },
    { bg: 'bg-[#A78BFA]', light: 'bg-[#A78BFA]/10' },
    { bg: 'bg-[#F87171]', light: 'bg-[#F87171]/10' },
    { bg: 'bg-[#9CA3AF]', light: 'bg-[#9CA3AF]/10' },
    { bg: 'bg-[#EC4899]', light: 'bg-[#EC4899]/10' },
    { bg: 'bg-[#8B5CF6]', light: 'bg-[#8B5CF6]/10' },
  ];
  const color = colors[index % colors.length];

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="bg-card rounded-2xl p-4 card-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${color.bg}`} />
          <span className="font-medium">{stat.category}</span>
        </div>
        <span className="font-semibold font-money">
          {formatAmount(stat.amount)}
        </span>
      </div>
      <div className="space-y-2">
        <div className={`h-2 rounded-full ${color.light} overflow-hidden`}>
          <div
            className={`h-full ${color.bg} rounded-full transition-all duration-500`}
            style={{ width: `${stat.percentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>占比 {stat.percentage}%</span>
        </div>
      </div>
    </div>
  );
};

// 成员消费明细项组件
const MemberItem = ({
  stat,
  total,
  index,
}: {
  stat: MemberStat;
  total: number;
  index: number;
}) => {
  const colors = [
    { bg: 'bg-[#2DD4BF]', light: 'bg-[#2DD4BF]/10' },
    { bg: 'bg-[#3B82F6]', light: 'bg-[#3B82F6]/10' },
    { bg: 'bg-[#FBBF24]', light: 'bg-[#FBBF24]/10' },
    { bg: 'bg-[#A78BFA]', light: 'bg-[#A78BFA]/10' },
    { bg: 'bg-[#F87171]', light: 'bg-[#F87171]/10' },
    { bg: 'bg-[#9CA3AF]', light: 'bg-[#9CA3AF]/10' },
    { bg: 'bg-[#EC4899]', light: 'bg-[#EC4899]/10' },
    { bg: 'bg-[#8B5CF6]', light: 'bg-[#8B5CF6]/10' },
  ];
  const color = colors[index % colors.length];

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="bg-card rounded-2xl p-4 card-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${color.bg}`} />
          <UserDisplay value={[stat.userId]} showLabel={true} size="small" />
        </div>
        <span className="font-semibold font-money">
          {formatAmount(stat.amount)}
        </span>
      </div>
      <div className="space-y-2">
        <div className={`h-2 rounded-full ${color.light} overflow-hidden`}>
          <div
            className={`h-full ${color.bg} rounded-full transition-all duration-500`}
            style={{ width: `${stat.percentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{stat.expenseCount} 笔消费</span>
          <span>占比 {stat.percentage}%</span>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
