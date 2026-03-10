import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Users, Vote, TrendingUp, Trophy, Activity, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import AppLayout from '@/components/AppLayout';

export default function Dashboard() {
  const { groupId } = useParams<{ groupId: string }>();
  const { groups } = useAppStore();

  const group = groups.find(g => g.id === groupId);

  if (!group) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Không tìm thấy nhóm</h2>
          <Link to="/my-groups" className="text-primary hover:underline">Quay lại</Link>
        </div>
      </AppLayout>
    );
  }

  const candidates = group.candidates;
  const sorted = [...candidates].sort((a, b) => b.voteCount - a.voteCount);
  const totalVotes = candidates.reduce((s, c) => s + c.voteCount, 0);

  const barData = sorted.map(c => ({ name: c.name.split(' ').pop(), votes: c.voteCount }));
  const pieData = sorted.map(c => ({ name: c.name.split(' ').pop(), value: c.voteCount }));
  const COLORS = ['hsl(250, 80%, 62%)', 'hsl(190, 90%, 50%)', 'hsl(160, 70%, 45%)', 'hsl(38, 92%, 55%)', 'hsl(340, 75%, 55%)'];

  const trendData = Array.from({ length: 12 }, (_, i) => ({
    time: `${i * 2}:00`,
    votes: Math.floor(Math.random() * 50 + 10 + i * 5),
  }));

  const statCards = [
    { icon: Users, label: 'Ứng viên', value: candidates.length, color: 'text-primary' },
    { icon: Vote, label: 'Tổng phiếu', value: totalVotes, color: 'text-accent' },
    { icon: Trophy, label: 'Dẫn đầu', value: sorted[0]?.name.split(' ').pop() || '-', color: 'text-success' },
    { icon: Activity, label: 'Người bầu', value: Object.keys(group.votes).length, color: 'text-warning' },
  ];

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/my-groups" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </Link>
          <h1 className="text-3xl font-bold mb-2">Dashboard: {group.name}</h1>
          <p className="text-muted-foreground mb-8">Thống kê bầu cử real-time</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl p-5">
              <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Phân bố phiếu bầu</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(222, 30%, 18%)', borderRadius: '12px', color: 'hsl(210, 40%, 96%)' }} />
                <Bar dataKey="votes" radius={[8, 8, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h3 className="font-semibold">Tỷ lệ phiếu bầu</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(222, 30%, 18%)', borderRadius: '12px', color: 'hsl(210, 40%, 96%)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-success" />
            <h3 className="font-semibold">Xu hướng bỏ phiếu</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(250, 80%, 62%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(250, 80%, 62%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
              <XAxis dataKey="time" stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(222, 30%, 18%)', borderRadius: '12px', color: 'hsl(210, 40%, 96%)' }} />
              <Area type="monotone" dataKey="votes" stroke="hsl(250, 80%, 62%)" fillOpacity={1} fill="url(#colorVotes)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </AppLayout>
  );
}
