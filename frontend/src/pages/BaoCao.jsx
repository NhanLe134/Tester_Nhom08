import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { format, startOfMonth, startOfWeek } from 'date-fns';
import { PrinterIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n || 0);
const fmtDate = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString('vi-VN') : '';

function getDateRange(key) {
  const today = new Date();
  const f = (d) => format(d, 'yyyy-MM-dd');
  if (key === 'today') return { tungay: f(today), denngay: f(today) };
  if (key === 'week') return { tungay: f(startOfWeek(today, { weekStartsOn: 1 })), denngay: f(today) };
  return { tungay: f(startOfMonth(today)), denngay: f(today) };
}

const PAGE_SIZE = 10;

export default function BaoCao() {
  const [tab, setTab] = useState('doanhthu'); // 'doanhthu' | 'hanghoa'
  const [timeKey, setTimeKey] = useState('month');
  const [tungay, setTungay] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [denngay, setDenngay] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [search, setSearch] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});
  const [showPrint, setShowPrint] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setPage(1);
    setExpandedRows({});
    try {
      const endpoint = tab === 'doanhthu' ? '/baocao/doanhthu' : '/baocao/hanghoa';
      const params = { tungay, denngay };
      if (tab === 'hanghoa' && search) params.search = search;
      const res = await api.get(endpoint, { params });
      setData(res.data);
    } catch { toast.error('Lỗi tải báo cáo'); }
    finally { setLoading(false); }
  }, [tab, tungay, denngay, search]);

  useEffect(() => { load(); }, [load]);

  const handleTimeKey = (key) => {
    setTimeKey(key);
    if (key !== 'custom') {
      const { tungay: t, denngay: d } = getDateRange(key);
      setTungay(t); setDenngay(d);
    }
  };

  const rows = data?.rows || [];
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleRow = (key) => setExpandedRows(p => ({ ...p, [key]: !p[key] }));

  const timeLabel = tungay === denngay
    ? fmtDate(tungay)
    : `Từ ${fmtDate(tungay)} đến ${fmtDate(denngay)}`;

  return (
    <div className="flex flex-col h-full">
      {/* Title */}
      <h1 className="text-xl font-bold text-gray-800 mb-3">
        {tab === 'doanhthu' ? 'Báo cáo Doanh thu' : 'Báo cáo Hàng hóa'}
      </h1>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* LEFT SIDEBAR */}
        <div className="w-52 flex-shrink-0 space-y-4">
          {/* Mối quan tâm */}
          <div className="border border-gray-300 rounded p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">Mối quan tâm</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="tab" checked={tab === 'doanhthu'}
                onChange={() => setTab('doanhthu')}
                className="accent-green-600" />
              <span className="text-sm">Thời gian</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input type="radio" name="tab" checked={tab === 'hanghoa'}
                onChange={() => setTab('hanghoa')}
                className="accent-green-600" />
              <span className="text-sm">Bán hàng</span>
            </label>
          </div>

          {/* Thời gian */}
          <div className="border border-gray-300 rounded p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">Thời gian</p>
            {[
              { k: 'today', l: 'Hôm nay' },
              { k: 'week', l: 'Tuần này' },
              { k: 'month', l: 'Tháng này' },
            ].map(({ k, l }) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer mb-1">
                <input type="radio" name="timekey" checked={timeKey === k}
                  onChange={() => handleTimeKey(k)} className="accent-green-600" />
                <span className="text-sm flex-1">{l}</span>
                {timeKey === k && <ChevronRightIcon className="w-3 h-3 text-gray-400" />}
              </label>
            ))}
            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input type="radio" name="timekey" checked={timeKey === 'custom'}
                onChange={() => handleTimeKey('custom')} className="accent-green-600" />
              <span className="text-sm flex-1">Tùy chỉnh</span>
              <span className="text-gray-400 text-xs">📅</span>
            </label>
            {timeKey === 'custom' && (
              <div className="mt-2 space-y-1">
                <input type="date" className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                  value={tungay} onChange={e => setTungay(e.target.value)} />
                <input type="date" className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                  value={denngay} onChange={e => setDenngay(e.target.value)} />
              </div>
            )}
          </div>

          {/* Tìm kiếm hàng hóa (chỉ hiện khi tab hanghoa) */}
          {tab === 'hanghoa' && (
            <div className="border border-gray-300 rounded p-3">
              <p className="text-xs font-semibold text-gray-500 mb-2">Hàng hóa</p>
              <input
                type="text"
                placeholder="Theo mã, tên hàng"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-green-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* RIGHT CONTENT - "paper" area */}
        <div className="flex-1 bg-gray-200 rounded flex flex-col min-h-0">
          {/* Toolbar: pagination + print */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-300 rounded-t">
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1}
                className="p-1 rounded hover:bg-gray-400 disabled:opacity-40">«</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1 rounded hover:bg-gray-400 disabled:opacity-40">
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <span className="px-3 py-0.5 bg-white rounded text-sm font-medium border border-gray-400">
                {page} / {totalPages}
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1 rounded hover:bg-gray-400 disabled:opacity-40">
                <ChevronRightIcon className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                className="p-1 rounded hover:bg-gray-400 disabled:opacity-40">»</button>
            </div>
            <button onClick={() => setShowPrint(true)}
              className="p-1.5 rounded hover:bg-gray-400" title="In báo cáo">
              <PrinterIcon className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Paper */}
          <div className="flex-1 overflow-auto p-4">
            <div className="bg-white rounded shadow-sm mx-auto max-w-3xl p-6 min-h-96">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : tab === 'doanhthu' ? (
                <DoanhThuContent data={data} timeLabel={timeLabel}
                  pagedRows={pagedRows} expandedRows={expandedRows} toggleRow={toggleRow} />
              ) : (
                <HangHoaContent data={data} timeLabel={timeLabel}
                  pagedRows={pagedRows} expandedRows={expandedRows} toggleRow={toggleRow} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Modal */}
      {showPrint && (
        <PrintModal
          tab={tab}
          data={data}
          timeLabel={timeLabel}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  );
}

// ── Báo cáo Doanh thu ──────────────────────────────────────────────
function DoanhThuContent({ data, timeLabel, pagedRows, expandedRows, toggleRow, tungay, denngay }) {
  const [details, setDetails] = useState({});

  const loadDetail = async (ngay) => {
    if (details[ngay]) return; // already loaded
    try {
      const res = await api.get('/baocao/doanhthu/detail', { params: { ngay } });
      setDetails(p => ({ ...p, [ngay]: res.data.rows }));
    } catch { setDetails(p => ({ ...p, [ngay]: [] })); }
  };

  const handleToggle = (ngay) => {
    toggleRow(ngay);
    loadDetail(ngay);
  };

  if (!data) return null;
  const { totals } = data;
  return (
    <>
      <h2 className="text-center font-bold text-lg mb-1">Báo cáo Doanh Thu</h2>
      <p className="text-center text-sm text-gray-500 mb-4">Thời gian: {timeLabel}</p>

      <table className="w-full text-sm border border-gray-300">
        <thead>
          <tr className="bg-green-100">
            <th className="border border-gray-300 py-2 px-3 text-left">Thời gian</th>
            <th className="border border-gray-300 py-2 px-3 text-right">Doanh thu</th>
            <th className="border border-gray-300 py-2 px-3 text-right">Giá trị trả</th>
            <th className="border border-gray-300 py-2 px-3 text-right">Doanh thu thuần</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-gray-50 font-semibold">
            <td className="border border-gray-300 py-2 px-3"></td>
            <td className="border border-gray-300 py-2 px-3 text-right">{fmt(totals?.doanhthu)}</td>
            <td className="border border-gray-300 py-2 px-3 text-right">{fmt(totals?.giatri_tra)}</td>
            <td className="border border-gray-300 py-2 px-3 text-right">{fmt(totals?.doanhthu_thuan)}</td>
          </tr>
          {pagedRows.length === 0 ? (
            <tr><td colSpan={4} className="text-center py-10 text-gray-400 border border-gray-300">Không có dữ liệu</td></tr>
          ) : pagedRows.map(r => (
            <React.Fragment key={r.thoigian}>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 py-2 px-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggle(r.thoigian)}
                      className="w-5 h-5 border border-gray-400 rounded flex items-center justify-center text-xs hover:bg-gray-100 flex-shrink-0">
                      {expandedRows[r.thoigian] ? '−' : '+'}
                    </button>
                    {fmtDate(r.thoigian)}
                  </div>
                </td>
                <td className="border border-gray-300 py-2 px-3 text-right">{fmt(r.doanhthu)}</td>
                <td className="border border-gray-300 py-2 px-3 text-right">{fmt(r.giatri_tra)}</td>
                <td className="border border-gray-300 py-2 px-3 text-right">{fmt(r.doanhthu_thuan)}</td>
              </tr>
              {expandedRows[r.thoigian] && (
                <tr>
                  <td colSpan={4} className="border border-gray-300 p-0">
                    <table className="w-full text-xs bg-green-50">
                      <thead>
                        <tr className="bg-green-100">
                          <th className="py-1.5 px-6 text-left font-semibold">Mã hóa đơn</th>
                          <th className="py-1.5 px-3 text-right font-semibold">Doanh thu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(details[r.thoigian] || []).map(d => (
                          <tr key={d.MAHDB} className="border-t border-gray-200">
                            <td className="py-1.5 px-6">{d.MAHDB}</td>
                            <td className="py-1.5 px-3 text-right">{fmt(d.doanhthu)}</td>
                          </tr>
                        ))}
                        {!details[r.thoigian] && (
                          <tr><td colSpan={2} className="py-2 px-6 text-gray-400">Đang tải...</td></tr>
                        )}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </>
  );
}

// ── Báo cáo Hàng hóa ───────────────────────────────────────────────
function HangHoaContent({ data, timeLabel, pagedRows, expandedRows, toggleRow, tungay, denngay }) {
  const [details, setDetails] = useState({});

  const loadDetail = async (masp) => {
    if (details[masp]) return;
    try {
      const res = await api.get('/baocao/hanghoa/detail', { params: { masp, tungay, denngay } });
      setDetails(p => ({ ...p, [masp]: res.data.rows }));
    } catch { setDetails(p => ({ ...p, [masp]: [] })); }
  };

  const handleToggle = (masp) => {
    toggleRow(masp);
    loadDetail(masp);
  };

  if (!data) return null;
  const { totals } = data;
  return (
    <>
      <h2 className="text-center font-bold text-lg mb-1">Báo cáo Hàng hóa</h2>
      <p className="text-center text-sm text-gray-500 mb-4">Thời gian: {timeLabel}</p>

      <table className="w-full text-sm border border-gray-300">
        <thead>
          <tr className="bg-green-100">
            <th className="border border-gray-300 py-2 px-2 text-left">Mã hàng</th>
            <th className="border border-gray-300 py-2 px-2 text-left">Tên hàng</th>
            <th className="border border-gray-300 py-2 px-2 text-right">SL Bán</th>
            <th className="border border-gray-300 py-2 px-2 text-right">Doanh thu</th>
            <th className="border border-gray-300 py-2 px-2 text-right">SL Trả</th>
            <th className="border border-gray-300 py-2 px-2 text-right">Giá trị trả</th>
            <th className="border border-gray-300 py-2 px-2 text-right">DT thuần</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-yellow-50 font-semibold text-sm">
            <td colSpan={2} className="border border-gray-300 py-2 px-2">
              SL mặt hàng: {totals?.sl_mat_hang || 0}
            </td>
            <td className="border border-gray-300 py-2 px-2 text-right">{fmt(totals?.sl_ban)}</td>
            <td className="border border-gray-300 py-2 px-2 text-right">{fmt(totals?.doanhthu)}</td>
            <td className="border border-gray-300 py-2 px-2 text-right">{fmt(totals?.sl_tra)}</td>
            <td className="border border-gray-300 py-2 px-2 text-right">{fmt(totals?.giatri_tra)}</td>
            <td className="border border-gray-300 py-2 px-2 text-right">{fmt(totals?.doanhthu_thuan)}</td>
          </tr>
          {pagedRows.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-10 text-gray-400 border border-gray-300">Không có dữ liệu</td></tr>
          ) : pagedRows.map(r => (
            <React.Fragment key={r.MASP}>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 py-2 px-2">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggle(r.MASP)}
                      className="w-5 h-5 border border-gray-400 rounded flex items-center justify-center text-xs hover:bg-gray-100 flex-shrink-0">
                      {expandedRows[r.MASP] ? '−' : '+'}
                    </button>
                    <span className="text-xs">{r.MASP}</span>
                  </div>
                </td>
                <td className="border border-gray-300 py-2 px-2 text-xs">{r.TENSP}</td>
                <td className="border border-gray-300 py-2 px-2 text-right">{r.sl_ban}</td>
                <td className="border border-gray-300 py-2 px-2 text-right">{fmt(r.doanhthu)}</td>
                <td className="border border-gray-300 py-2 px-2 text-right">{r.sl_tra}</td>
                <td className="border border-gray-300 py-2 px-2 text-right">{fmt(r.giatri_tra)}</td>
                <td className="border border-gray-300 py-2 px-2 text-right">{fmt(r.doanhthu_thuan)}</td>
              </tr>
              {expandedRows[r.MASP] && (
                <tr>
                  <td colSpan={7} className="border border-gray-300 p-0">
                    <table className="w-full text-xs bg-green-50">
                      <thead>
                        <tr className="bg-green-100">
                          <th className="py-1.5 px-6 text-left font-semibold">Mã hóa đơn</th>
                          <th className="py-1.5 px-3 text-right font-semibold">Số lượng</th>
                          <th className="py-1.5 px-3 text-right font-semibold">Doanh thu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(details[r.MASP] || []).map(d => (
                          <tr key={d.MAHDB} className="border-t border-gray-200">
                            <td className="py-1.5 px-6">{d.MAHDB}</td>
                            <td className="py-1.5 px-3 text-right">{d.SOLUONG}</td>
                            <td className="py-1.5 px-3 text-right">{fmt(d.doanhthu)}</td>
                          </tr>
                        ))}
                        {!details[r.MASP] && (
                          <tr><td colSpan={3} className="py-2 px-6 text-gray-400">Đang tải...</td></tr>
                        )}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </>
  );
}

// ── Print Modal ─────────────────────────────────────────────────────
function PrintModal({ tab, data, timeLabel, onClose }) {
  const [printer, setPrinter] = useState('');
  const [paperSize, setPaperSize] = useState('A4');
  const [pages, setPages] = useState('Tất cả');
  const [color, setColor] = useState('Màu');

  const handlePrint = () => {
    window.print();
    onClose();
  };

  const rows = data?.rows || [];
  const totals = data?.totals;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl flex w-[820px] h-[90vh] overflow-hidden">
        {/* Preview area (left) */}
        <div className="flex-1 bg-gray-300 p-4 flex flex-col overflow-hidden">
          <div className="bg-white shadow p-6 flex-1 overflow-auto text-xs">
            <h2 className="text-center font-bold text-base mb-1">
              {tab === 'doanhthu' ? 'Báo cáo Doanh Thu' : 'Báo cáo Hàng hóa'}
            </h2>
            <p className="text-center text-gray-500 mb-4">Thời gian: {timeLabel}</p>

            {tab === 'doanhthu' ? (
              <table className="w-full border border-gray-300 text-xs">
                <thead>
                  <tr className="bg-green-100">
                    <th className="border border-gray-300 py-1 px-2 text-left">Thời gian</th>
                    <th className="border border-gray-300 py-1 px-2 text-right">Doanh thu</th>
                    <th className="border border-gray-300 py-1 px-2 text-right">Giá trị trả</th>
                    <th className="border border-gray-300 py-1 px-2 text-right">Doanh thu thuần</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.thoigian}>
                      <td className="border border-gray-300 py-1 px-2">{fmtDate(r.thoigian)}</td>
                      <td className="border border-gray-300 py-1 px-2 text-right">{fmt(r.doanhthu)}</td>
                      <td className="border border-gray-300 py-1 px-2 text-right">{fmt(r.giatri_tra)}</td>
                      <td className="border border-gray-300 py-1 px-2 text-right">{fmt(r.doanhthu_thuan)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full border border-gray-300 text-xs">
                <thead>
                  <tr className="bg-green-100">
                    <th className="border border-gray-300 py-1.5 px-2 text-left">Mã hàng</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-left">Tên hàng</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-center">SL Bán</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-center">Doanh thu</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-center">SL Trả</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-center">Giá trị trả</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-center">Doanh thu thuần</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.MASP}>
                      <td className="border border-gray-300 py-1.5 px-2">{r.MASP}</td>
                      <td className="border border-gray-300 py-1.5 px-2">{r.TENSP}</td>
                      <td className="border border-gray-300 py-1.5 px-2 text-center">{r.sl_ban}</td>
                      <td className="border border-gray-300 py-1.5 px-2 text-center">{fmt(r.doanhthu)}</td>
                      <td className="border border-gray-300 py-1.5 px-2 text-center">{r.sl_tra}</td>
                      <td className="border border-gray-300 py-1.5 px-2 text-center">{fmt(r.giatri_tra)}</td>
                      <td className="border border-gray-300 py-1.5 px-2 text-center">{fmt(r.doanhthu_thuan)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Controls (right) */}
        <div className="w-56 flex-shrink-0 p-4 flex flex-col border-l border-gray-200">
          <h3 className="font-bold text-base mb-4">In</h3>

          <div className="space-y-3 flex-1">
            {[
              { label: 'Máy in', val: printer, set: setPrinter, placeholder: 'Chọn máy in', opts: ['Máy in mặc định', 'PDF'] },
              { label: 'Khổ giấy', val: paperSize, set: setPaperSize, placeholder: 'Chọn khổ giấy', opts: ['A4', 'A5', 'Letter'] },
              { label: 'Số trang', val: pages, set: setPages, placeholder: 'Chọn số trang', opts: ['Tất cả', 'Trang hiện tại'] },
              { label: 'Màu', val: color, set: setColor, placeholder: 'Màu', opts: ['Màu', 'Đen trắng'] },
            ].map(({ label, val, set, placeholder, opts }) => (
              <div key={label}>
                <label className="text-xs text-gray-500 block mb-1">{label}</label>
                <select value={val} onChange={e => set(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-green-500">
                  <option value="">{placeholder}</option>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={onClose}
              className="flex-1 border border-gray-300 rounded py-2 text-sm hover:bg-gray-50">
              Hủy
            </button>
            <button onClick={handlePrint}
              className="flex-1 bg-green-600 text-white rounded py-2 text-sm font-medium hover:bg-green-700">
              In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
