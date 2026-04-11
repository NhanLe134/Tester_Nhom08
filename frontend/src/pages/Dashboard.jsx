import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import { format, startOfWeek, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';

const fmtCurrency = (n) => new Intl.NumberFormat('vi-VN').format(n || 0);

const DAY_NAMES = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

      const [todayRes, weekRes] = await Promise.all([
        api.get(`/baocao/doanhthu?tungay=${today}&denngay=${today}`),
        api.get(`/baocao/doanhthu?tungay=${weekStart}&denngay=${today}`),
      ]);

      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
        const key = format(d, 'yyyy-MM-dd');
        const found = weekRes.data.rows.find(r => r.thoigian === key);
        return {
          name: DAY_NAMES[i],
          doanhthu: found?.doanhthu || 0,
          don: found?.so_don || 0,
        };
      });

      setData({ today: todayRes.data.totals, weekChart: weekDays });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
    </div>
  );

  const today = data?.today || {};
  const weekChart = data?.weekChart || [];

  return (
    <div className="flex gap-4">
      {/* LEFT: main content */}
      <div className="flex-1 space-y-4 min-w-0">

        {/* Card: Kết quả bán hàng hôm nay */}
        <div className="bg-white rounded border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Kết quả bán hàng hôm nay</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">$</div>
              <div>
                <p className="text-xs text-gray-500">Doanh thu</p>
                <p className="text-base font-bold text-gray-800">{fmtCurrency(today.doanhthu)}</p>
              </div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-sm font-bold">↩</div>
              <div>
                <p className="text-xs text-gray-500">Đơn hàng trả</p>
                <p className="text-base font-bold text-gray-800">{fmtCurrency(today.giatri_tra)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Số đơn hàng */}
        <div className="bg-white rounded border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Số đơn hàng</p>
          <div className="flex items-center gap-4">
            <div className="flex-1 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs">📋</div>
                <div>
                  <p className="text-xs text-gray-500">Đơn hàng bán</p>
                  <p className="text-base font-bold text-gray-800">{today.so_don || 0}</p>
                </div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-xs">↩</div>
                <div>
                  <p className="text-xs text-gray-500">Đơn hàng trả</p>
                  <p className="text-base font-bold text-gray-800">0</p>
                </div>
              </div>
            </div>
            {/* Mini bar chart */}
            <div className="w-32 h-14">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekChart} barSize={8}>
                  <Bar dataKey="don" fill="#86efac" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Card: Doanh thu line chart */}
        <div className="bg-white rounded border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Doanh thu</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weekChart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false}
                tickFormatter={v => v === 0 ? '0' : (v / 1000) + 'k'} />
              <Tooltip formatter={(v) => [fmtCurrency(v) + ' đ', 'Doanh thu']} />
              <Line type="monotone" dataKey="doanhthu" stroke="#16a34a" strokeWidth={2}
                dot={{ r: 3, fill: '#16a34a' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RIGHT: Thông báo */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Thông báo</p>
          <NotificationList />
        </div>
      </div>
    </div>
  );
}

function NotificationList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load low-stock products as notifications
    api.get('/hanghoa?trangthai=Đang bán&page=1').then(res => {
      const lowStock = (res.data.items || []).filter(p => p.SL_TON <= p.DMUC_TON_MIN);
      setItems(lowStock.slice(0, 5));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-xs text-gray-400 text-center py-4">Đang tải...</div>;

  if (items.length === 0) return (
    <p className="text-xs text-gray-400 text-center py-4">Không có thông báo</p>
  );

  return (
    <div className="space-y-3">
      {items.map(p => (
        <div key={p.MASP} className="flex gap-2">
          <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 flex-shrink-0 text-xs font-bold mt-0.5">!</div>
          <div>
            <p className="text-xs font-semibold text-gray-700">Tồn kho thấp</p>
            <p className="text-xs text-gray-500">{p.TENSP} còn {p.SL_TON} {p.DVT}</p>
            <p className="text-xs text-gray-400">Định mức: {p.DMUC_TON_MIN}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
