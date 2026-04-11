import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { PrinterIcon } from '@heroicons/react/24/outline';
import { format, startOfWeek, startOfMonth } from 'date-fns';

const fmtCurrency = (n) => new Intl.NumberFormat('vi-VN').format(n || 0) + ' đ';
const fmtDate = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString('vi-VN') : '';

const TIME_FILTERS = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'week', label: 'Tuần này' },
  { key: 'month', label: 'Tháng này' },
  { key: 'custom', label: 'Tùy chỉnh' },
];

function getDateRange(key) {
  const today = new Date();
  const fmt = (d) => format(d, 'yyyy-MM-dd');
  switch (key) {
    case 'today': return { tungay: fmt(today), denngay: fmt(today) };
    case 'week': return { tungay: fmt(startOfWeek(today, { weekStartsOn: 1 })), denngay: fmt(today) };
    case 'month': return { tungay: fmt(startOfMonth(today)), denngay: fmt(today) };
    default: return { tungay: fmt(startOfMonth(today)), denngay: fmt(today) };
  }
}

export default function BaoCao() {
  const [tab, setTab] = useState('doanhthu');
  const [timeFilter, setTimeFilter] = useState('month');
  const [tungay, setTungay] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [denngay, setDenngay] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = tab === 'doanhthu' ? '/baocao/doanhthu' : '/baocao/hanghoa';
      const res = await api.get(endpoint, { params: { tungay, denngay } });
      setData(res.data);
    } catch { toast.error('Lỗi tải báo cáo'); }
    finally { setLoading(false); }
  }, [tab, tungay, denngay]);

  useEffect(() => { load(); }, [load]);

  const handleTimeFilter = (key) => {
    setTimeFilter(key);
    if (key !== 'custom') {
      const { tungay: t, denngay: d } = getDateRange(key);
      setTungay(t);
      setDenngay(d);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Báo cáo</h1>
        <button onClick={() => window.print()} className="btn-secondary no-print">
          <PrinterIcon className="w-4 h-4" /> In báo cáo
        </button>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-1 border-b border-gray-200 no-print">
        {[{ k: 'doanhthu', l: 'Báo cáo Doanh thu' }, { k: 'hanghoa', l: 'Báo cáo Hàng hóa' }].map(({ k, l }) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === k ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Time filter */}
      <div className="flex flex-wrap items-center gap-3 no-print">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {TIME_FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => handleTimeFilter(key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${timeFilter === key ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>
        {timeFilter === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" className="input-field w-auto text-sm" value={tungay} onChange={e => setTungay(e.target.value)} />
            <span className="text-gray-400">—</span>
            <input type="date" className="input-field w-auto text-sm" value={denngay} onChange={e => setDenngay(e.target.value)} />
          </div>
        )}
        <span className="text-sm text-gray-500">
          {fmtDate(tungay)} — {fmtDate(denngay)}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : tab === 'doanhthu' ? (
        <DoanhThuTable data={data} />
      ) : (
        <HangHoaTable data={data} />
      )}
    </div>
  );
}

function DoanhThuTable({ data }) {
  if (!data) return null;
  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="table-header">
            <th className="text-left py-3 px-4">Thời gian</th>
            <th className="text-right py-3 px-4">Doanh thu</th>
            <th className="text-right py-3 px-4">Giá trị trả</th>
            <th className="text-right py-3 px-4">Doanh thu thuần</th>
            <th className="text-right py-3 px-4">Số đơn</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.length === 0 ? (
            <tr><td colSpan={5} className="text-center py-12 text-gray-400">Không có dữ liệu trong khoảng thời gian này</td></tr>
          ) : data.rows.map(r => (
            <tr key={r.thoigian} className="table-row">
              <td className="py-3 px-4">{new Date(r.thoigian + 'T00:00:00').toLocaleDateString('vi-VN')}</td>
              <td className="py-3 px-4 text-right text-green-700 font-semibold">{fmtCurrency(r.doanhthu)}</td>
              <td className="py-3 px-4 text-right text-red-500">{fmtCurrency(r.giatri_tra)}</td>
              <td className="py-3 px-4 text-right font-bold">{fmtCurrency(r.doanhthu_thuan)}</td>
              <td className="py-3 px-4 text-right">{r.so_don}</td>
            </tr>
          ))}
        </tbody>
        {data.rows.length > 0 && (
          <tfoot>
            <tr className="bg-green-50 font-bold border-t-2 border-green-200">
              <td className="py-3 px-4">Tổng cộng</td>
              <td className="py-3 px-4 text-right text-green-700">{fmtCurrency(data.totals.doanhthu)}</td>
              <td className="py-3 px-4 text-right text-red-500">{fmtCurrency(data.totals.giatri_tra)}</td>
              <td className="py-3 px-4 text-right">{fmtCurrency(data.totals.doanhthu_thuan)}</td>
              <td className="py-3 px-4 text-right">{data.totals.so_don}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function HangHoaTable({ data }) {
  if (!data) return null;
  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="table-header">
            <th className="text-left py-3 px-4">Mã hàng</th>
            <th className="text-left py-3 px-4">Tên hàng</th>
            <th className="text-right py-3 px-4">SL bán</th>
            <th className="text-right py-3 px-4">Doanh thu</th>
            <th className="text-right py-3 px-4">Lợi nhuận</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.length === 0 ? (
            <tr><td colSpan={5} className="text-center py-12 text-gray-400">Không có dữ liệu trong khoảng thời gian này</td></tr>
          ) : data.rows.map(r => (
            <tr key={r.MASP} className="table-row">
              <td className="py-3 px-4 font-mono text-xs text-gray-500">{r.MASP}</td>
              <td className="py-3 px-4 font-medium">{r.TENSP}</td>
              <td className="py-3 px-4 text-right">{r.sl_ban} {r.DVT}</td>
              <td className="py-3 px-4 text-right text-green-700 font-semibold">{fmtCurrency(r.doanhthu)}</td>
              <td className="py-3 px-4 text-right font-semibold">{fmtCurrency(r.loinhuanthu)}</td>
            </tr>
          ))}
        </tbody>
        {data.rows.length > 0 && (
          <tfoot>
            <tr className="bg-green-50 font-bold border-t-2 border-green-200">
              <td colSpan={2} className="py-3 px-4">Tổng cộng</td>
              <td className="py-3 px-4 text-right">{data.totals.sl_ban}</td>
              <td className="py-3 px-4 text-right text-green-700">{fmtCurrency(data.totals.doanhthu)}</td>
              <td className="py-3 px-4 text-right">{fmtCurrency(data.totals.loinhuanthu)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
