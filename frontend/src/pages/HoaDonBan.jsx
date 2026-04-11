import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth } from 'date-fns';

const fmtCurrency = (n) => new Intl.NumberFormat('vi-VN').format(n || 0) + ' đ';
const fmtDate = (s) => s ? new Date(s).toLocaleString('vi-VN') : '';

function ExpandedInvoice({ invoice, onCancelled }) {
  const [detail, setDetail] = useState(null);
  const [ghichu, setGhichu] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    api.get(`/hoadonban/${invoice.MAHDB}`)
      .then(r => { setDetail(r.data); setGhichu(r.data.GHICHU || ''); })
      .catch(() => toast.error('Lỗi tải chi tiết'))
      .finally(() => setLoading(false));
  }, [invoice.MAHDB]);

  const saveNote = async () => {
    setSaving(true);
    try {
      await api.put(`/hoadonban/${invoice.MAHDB}/ghichu`, { ghichu });
      toast.success('Đã lưu ghi chú');
    } catch { toast.error('Lỗi lưu ghi chú'); }
    finally { setSaving(false); }
  };

  const cancelInvoice = async () => {
    setCancelling(true);
    try {
      await api.put(`/hoadonban/${invoice.MAHDB}/huy`);
      toast.success('Đã hủy hóa đơn');
      setShowCancel(false);
      onCancelled();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi hủy hóa đơn');
    } finally { setCancelling(false); }
  };

  if (loading) return <tr><td colSpan={4} className="py-4 text-center text-gray-400 bg-blue-50">Đang tải...</td></tr>;

  return (
    <tr>
      <td colSpan={4} className="bg-blue-50 px-6 py-4">
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Mã HĐ:</span> <strong>{detail?.MAHDB}</strong></div>
            <div><span className="text-gray-500">Ngày bán:</span> <strong>{fmtDate(detail?.NGAYBAN)}</strong></div>
            <div><span className="text-gray-500">Thanh toán:</span> <strong>{detail?.PTTT}</strong></div>
            <div><span className="text-gray-500">Trạng thái:</span>
              <span className={`ml-1 ${detail?.TRANGTHAI_HDB === 'Hoàn thành' ? 'badge-green' : 'badge-red'}`}>{detail?.TRANGTHAI_HDB}</span>
            </div>
          </div>

          <table className="w-full text-sm bg-white rounded-lg overflow-hidden">
            <thead><tr className="table-header">
              <th className="text-left py-2 px-3">Mã SP</th>
              <th className="text-left py-2 px-3">Tên sản phẩm</th>
              <th className="text-right py-2 px-3">SL</th>
              <th className="text-right py-2 px-3">Đơn giá</th>
              <th className="text-right py-2 px-3">Thành tiền</th>
            </tr></thead>
            <tbody>
              {detail?.items?.map(i => (
                <tr key={i.MASP} className="border-b border-gray-100">
                  <td className="py-2 px-3 font-mono text-xs text-gray-500">{i.MASP}</td>
                  <td className="py-2 px-3">{i.TENSP}</td>
                  <td className="py-2 px-3 text-right">{i.SOLUONG}</td>
                  <td className="py-2 px-3 text-right">{fmtCurrency(i.GIABAN)}</td>
                  <td className="py-2 px-3 text-right font-semibold">{fmtCurrency(i.SOLUONG * i.GIABAN)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td colSpan={4} className="py-2 px-3 text-right">Tổng cộng:</td>
                <td className="py-2 px-3 text-right text-green-700">{fmtCurrency(detail?.TONGTIENHANG_BAN)}</td>
              </tr>
            </tbody>
          </table>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea className="input-field resize-none" rows={2} value={ghichu}
              onChange={e => setGhichu(e.target.value)} placeholder="Nhập ghi chú..." />
          </div>

          <div className="flex gap-2">
            <button onClick={saveNote} disabled={saving} className="btn-primary">
              {saving ? 'Đang lưu...' : 'Lưu ghi chú'}
            </button>
            {detail?.TRANGTHAI_HDB === 'Hoàn thành' && (
              <button onClick={() => setShowCancel(true)} className="btn-danger">Hủy hóa đơn</button>
            )}
          </div>
        </div>

        {showCancel && (
          <div className="modal-overlay" onClick={() => setShowCancel(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="text-center">
                <div className="text-4xl mb-3">⚠️</div>
                <h3 className="font-bold text-lg mb-2">Hủy hóa đơn?</h3>
                <p className="text-gray-500 text-sm mb-5">Tồn kho sẽ được hoàn trả. Hành động này không thể hoàn tác.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowCancel(false)} className="btn-secondary flex-1 justify-center">Không</button>
                  <button onClick={cancelInvoice} disabled={cancelling} className="btn-danger flex-1">
                    {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function HoaDonBan() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [filterStatus, setFilterStatus] = useState({ 'Hoàn thành': true, 'Đã hủy': true });
  const [filterPTTT, setFilterPTTT] = useState({ 'Tiền mặt': true, 'Chuyển khoản': true });
  const [dateMode, setDateMode] = useState('thang');
  const [tungay, setTungay] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [denngay, setDenngay] = useState(format(new Date(), 'yyyy-MM-dd'));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const statuses = Object.entries(filterStatus).filter(([, v]) => v).map(([k]) => k).join(',');
      const pttts = Object.entries(filterPTTT).filter(([, v]) => v).map(([k]) => k).join(',');
      const res = await api.get('/hoadonban', {
        params: { page, limit: 15, search, trangthai: statuses, pttt: pttts, tungay, denngay }
      });
      setItems(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch { toast.error('Lỗi tải dữ liệu'); }
    finally { setLoading(false); }
  }, [page, search, filterStatus, filterPTTT, tungay, denngay]);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = (k) => { setFilterStatus(p => ({ ...p, [k]: !p[k] })); setPage(1); };
  const togglePTTT = (k) => { setFilterPTTT(p => ({ ...p, [k]: !p[k] })); setPage(1); };

  const handleDateMode = (mode) => {
    setDateMode(mode);
    const today = new Date();
    if (mode === 'thang') {
      setTungay(format(startOfMonth(today), 'yyyy-MM-dd'));
      setDenngay(format(today, 'yyyy-MM-dd'));
    }
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Hóa đơn bán hàng</h1>
        <button onClick={() => navigate('/ban-hang')} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Tạo mới
        </button>
      </div>

      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="w-52 shrink-0 space-y-4">
          <div className="card">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Thời gian</p>
            <div className="space-y-1">
              {[{ v: 'thang', l: 'Tháng này' }, { v: 'custom', l: 'Tùy chỉnh' }].map(({ v, l }) => (
                <label key={v} className="flex items-center gap-2 text-sm cursor-pointer py-1">
                  <input type="radio" name="dateMode" checked={dateMode === v} onChange={() => handleDateMode(v)}
                    className="text-green-600 focus:ring-green-500" />
                  {l}
                </label>
              ))}
            </div>
            {dateMode === 'custom' && (
              <div className="mt-2 space-y-2">
                <div>
                  <label className="text-xs text-gray-500">Từ ngày</label>
                  <input type="date" className="input-field text-xs" value={tungay} onChange={e => { setTungay(e.target.value); setPage(1); }} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Đến ngày</label>
                  <input type="date" className="input-field text-xs" value={denngay} onChange={e => { setDenngay(e.target.value); setPage(1); }} />
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Trạng thái</p>
            {Object.keys(filterStatus).map(k => (
              <label key={k} className="flex items-center gap-2 text-sm cursor-pointer py-1">
                <input type="checkbox" checked={filterStatus[k]} onChange={() => toggleStatus(k)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                {k}
              </label>
            ))}
          </div>

          <div className="card">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Thanh toán</p>
            {Object.keys(filterPTTT).map(k => (
              <label key={k} className="flex items-center gap-2 text-sm cursor-pointer py-1">
                <input type="checkbox" checked={filterPTTT[k]} onChange={() => togglePTTT(k)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                {k}
              </label>
            ))}
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 space-y-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input-field pl-9" placeholder="Tìm theo mã hóa đơn..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left py-3 px-4">Mã hóa đơn</th>
                  <th className="text-left py-3 px-4">Thời gian</th>
                  <th className="text-right py-3 px-4">Tổng tiền</th>
                  <th className="text-center py-3 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-12 text-gray-400">Đang tải...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-12 text-gray-400">Không có hóa đơn nào</td></tr>
                ) : items.map(inv => (
                  <React.Fragment key={inv.MAHDB}>
                    <tr className="table-row cursor-pointer" onClick={() => setExpandedRow(expandedRow === inv.MAHDB ? null : inv.MAHDB)}>
                      <td className="py-3 px-4 font-mono font-semibold text-green-700">{inv.MAHDB}</td>
                      <td className="py-3 px-4 text-gray-600">{fmtDate(inv.NGAYBAN)}</td>
                      <td className="py-3 px-4 text-right font-semibold">{fmtCurrency(inv.TONGTIENHANG_BAN)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={inv.TRANGTHAI_HDB === 'Hoàn thành' ? 'badge-green' : 'badge-red'}>{inv.TRANGTHAI_HDB}</span>
                      </td>
                    </tr>
                    {expandedRow === inv.MAHDB && (
                      <ExpandedInvoice invoice={inv} onCancelled={() => { setExpandedRow(null); load(); }} />
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">Tổng: {total} hóa đơn</p>
                <div className="flex gap-1">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-50">‹</button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`px-3 py-1 rounded border text-sm ${page === p ? 'bg-green-600 text-white border-green-600' : 'hover:bg-gray-50'}`}>{p}</button>
                  ))}
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-50">›</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
