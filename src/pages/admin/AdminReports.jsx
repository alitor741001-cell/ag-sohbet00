import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

export default function AdminReports() {
  const [data, setData] = useState({ users: [], views: [], revenue: [] });
  useEffect(() => {
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu'];
    setData({
      users: months.map((m) => ({ name: m, value: Math.floor(Math.random() * 80) + 20 })),
      views: months.map((m) => ({ name: m, value: Math.floor(Math.random() * 3000) + 500 })),
      revenue: months.map((m) => ({ name: m, value: Math.floor(Math.random() * 20000) + 5000 })),
    });
  }, []);
  const tip = { background: 'hsl(240 8% 7%)', border: '1px solid hsl(240 6% 16%)', borderRadius: 8 };
  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-6">Raporlar</h1>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4"><h3 className="font-semibold mb-3">Kullanıcı Büyümesi</h3><ResponsiveContainer width="100%" height={240}><BarChart data={data.users}><CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 16%)" /><XAxis dataKey="name" stroke="hsl(240 5% 65%)" fontSize={12} /><YAxis stroke="hsl(240 5% 65%)" fontSize={12} /><Tooltip contentStyle={tip} /><Bar dataKey="value" fill="hsl(265 83% 60%)" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer></div>
        <div className="bg-card border border-border rounded-xl p-4"><h3 className="font-semibold mb-3">İzlenme İstatistikleri</h3><ResponsiveContainer width="100%" height={240}><LineChart data={data.views}><CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 16%)" /><XAxis dataKey="name" stroke="hsl(240 5% 65%)" fontSize={12} /><YAxis stroke="hsl(240 5% 65%)" fontSize={12} /><Tooltip contentStyle={tip} /><Line type="monotone" dataKey="value" stroke="hsl(0 72% 51%)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
        <div className="bg-card border border-border rounded-xl p-4 lg:col-span-2"><h3 className="font-semibold mb-3">Gelir Grafiği</h3><ResponsiveContainer width="100%" height={240}><BarChart data={data.revenue}><CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 16%)" /><XAxis dataKey="name" stroke="hsl(240 5% 65%)" fontSize={12} /><YAxis stroke="hsl(240 5% 65%)" fontSize={12} /><Tooltip contentStyle={tip} /><Bar dataKey="value" fill="hsl(140 70% 45%)" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer></div>
      </div>
    </div>
  );
}