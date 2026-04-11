import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import { format, startOfWeek, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';

const fmtCurrency = (n) => new Intl.NumberFormat('vi-VN').format(n || 0) + ' đ';

function KpiCard({ title, value, sub, color = 'green', icon }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-${color}-100`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{title}</p>
        <p className="text-xl font-bold text-gray-800">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

      const [todayRes, weekRes, productRes] = await Promise.all([
        api.get(`/baocao/doanhthu?tungay=${today}&denngay=${today}`),
        api.get(`/baocao/doanhthu?tungay=${weekStart}&denngay=${today}`),
        api.get('/hanghoa?limit=5&tonkho=thap'),
      ]);

      // Build week chart data (Mon-Sun)
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
        const key = format(d, 'yyyy-MM-dd');
        const found = weekRes.data.rows.find(r => r.thoigian === key);
        return {
          name: format(d, 'EEE', { locale: vi }),
          doanhthu: found?.doanhthu || 0,
          don: found?.so_don || 0,
        };
      });

      setData({
        today: todayRes.data.totals,
        weekChart: weekDays,
        lowStock: productRes.data.items,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Tổng quan</h1>
        <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, dd/MM/yyyy', { locale: vi })}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Doanh thu hôm nay" value={fmtCurrency(data?.today?.doanhthu)} icon="💰" color="green" />
        <KpiCard title="Doanh thu thuần" value={fmtCurrency(data?.today?.doanhthu_thuan)} icon="📈" color="blue" />
        <KpiCard title="Số đơn hàng" value={data?.today?.so_don || 0} sub="hôm nay" icon="🧾" color="yellow" />
        <KpiCard title="Đơn trả / hủy" value={fmtCurrency(data?.today?.giatri_tra)} icon="↩️" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue line chart */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-gray-700 mb-4">Doanh thu tuần này</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.weekChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v / 1000) + 'k'} />
              <Tooltip formatter={(v) => fmtCurrency(v)} />
              <Line type="monotone" dataKey="doanhthu" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} name="Doanh thu" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders bar chart */}
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4">Số đơn hàng tuần</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.weekChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="don" fill="#16a34a" radius={[4, 4, 0, 0]} name="Đơn hàng" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low stock alert */}
      {data?.lowStock?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">⚠️ Hàng sắp hết tồn kho</h2>
            <button onClick={() => navigate('/hang-hoa')} className="text-sm text-green-600 hover:underline">Xem tất cả</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left py-2 px-3">Mã SP</th>
                  <th className="text-left py-2 px-3">Tên sản phẩm</th>
                  <th className="text-right py-2 px-3">Tồn kho</th>
                  <th className="text-right py-2 px-3">Tồn tối thiểu</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStock.map(p => (
                  <tr key={p.MASP} className="table-row">
                    <td className="py-2 px-3 font-mono text-xs text-gray-500">{p.MASP}</td>
                    <td className="py-2 px-3 font-medium">{p.TENSP}</td>
                    <td className="py-2 px-3 text-right">
                      <span className={`font-bold ${p.SL_TON === 0 ? 'text-red-600' : 'text-yellow-600'}`}>{p.SL_TON}</span>
                    </td>
                    <td className="py-2 px-3 text-right text-gray-500">{p.DMUC_TON_MIN}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
