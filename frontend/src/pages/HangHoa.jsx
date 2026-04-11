import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon,
  ChevronDownIcon, ChevronUpIcon, PrinterIcon, XMarkIcon
} from '@heroicons/react/24/outline';

const fmtCurrency = (n) => new Intl.NumberFormat('vi-VN').format(n || 0) + ' đ';
const fmtDate = (s) => s ? new Date(s).toLocaleString('vi-VN') : '';

const EMPTY_FORM = { TENSP: '', DVT: 'Cái', GIABAN: '', GIANHAP: '', SL_TON: '', DMUC_TON_MIN: '', TRANGTHAI_SP: 'Đang bán' };

function ProductModal({ mode, product, onClose, onSaved }) {
  const [form, setForm] = useState(mode === 'edit' ? { ...product } : { ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.TENSP) return toast.error('Tên sản phẩm không được để trống');
    setLoading(true);
    try {
      if (mode === 'edit') {
        await api.put(`/hanghoa/${product.MASP}`, form);
        toast.success('Cập nhật thành công');
      } else {
        await api.post('/hanghoa', form);
        toast.success('Thêm sản phẩm thành công');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi lưu dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const f = (k) => ({ value: form[k] ?? '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-lg">{mode === 'edit' ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
            <input className="input-field" placeholder="Nhập tên sản phẩm" {...f('TENSP')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị tính</label>
              <select className="input-field" {...f('DVT')}>
                {['Cái', 'Gói', 'Chai', 'Lon', 'Hộp', 'Kg', 'Lít', 'Túi', 'Bịch'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select className="input-field" {...f('TRANGTHAI_SP')}>
                <option>Đang bán</option>
                <option>Ngừng bán</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán (đ)</label>
              <input type="number" className="input-field" placeholder="0" {...f('GIABAN')} min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá nhập (đ)</label>
              <input type="number" className="input-field" placeholder="0" {...f('GIANHAP')} min="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho</label>
              <input type="number" className="input-field" placeholder="0" {...f('SL_TON')} min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tồn tối thiểu</label>
              <input type="number" className="input-field" placeholder="0" {...f('DMUC_TON_MIN')} min="0" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Hủy</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ product, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/hanghoa/${product.MASP}`);
      toast.success('Đã ngừng kinh doanh sản phẩm');
      onDeleted();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xóa sản phẩm');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="text-5xl mb-3">⚠️</div>
          <h3 className="font-bold text-lg mb-2">Ngừng kinh doanh?</h3>
          <p className="text-gray-500 text-sm mb-5">Sản phẩm <strong>{product.TENSP}</strong> sẽ bị ngừng bán và tồn kho về 0.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Hủy</button>
            <button onClick={handleDelete} disabled={loading} className="btn-danger flex-1">
              {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpandedRow({ product }) {
  const [tab, setTab] = useState('info');
  const [history, setHistory] = useState([]);
  const [loadingH, setLoadingH] = useState(false);

  useEffect(() => {
    if (tab === 'tonkho') {
      setLoadingH(true);
      api.get(`/hanghoa/${product.MASP}/tonkho`)
        .then(r => setHistory(r.data))
        .catch(() => {})
        .finally(() => setLoadingH(false));
    }
  }, [tab, product.MASP]);

  return (
    <tr>
      <td colSpan={7} className="bg-green-50 px-6 py-4">
        <div className="flex gap-3 mb-3">
          {['info', 'tonkho'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {t === 'info' ? 'Thông tin' : 'Chi tiết tồn kho'}
            </button>
          ))}
        </div>
        {tab === 'info' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-500">Mã SP:</span> <strong>{product.MASP}</strong></div>
            <div><span className="text-gray-500">ĐVT:</span> <strong>{product.DVT}</strong></div>
            <div><span className="text-gray-500">Giá bán:</span> <strong className="text-green-700">{fmtCurrency(product.GIABAN)}</strong></div>
            <div><span className="text-gray-500">Giá nhập:</span> <strong>{fmtCurrency(product.GIANHAP)}</strong></div>
            <div><span className="text-gray-500">Tồn kho:</span> <strong>{product.SL_TON}</strong></div>
            <div><span className="text-gray-500">Tồn tối thiểu:</span> <strong>{product.DMUC_TON_MIN}</strong></div>
            <div><span className="text-gray-500">Trạng thái:</span> <strong>{product.TRANGTHAI_SP}</strong></div>
          </div>
        )}
        {tab === 'tonkho' && (
          loadingH ? <div className="text-sm text-gray-500">Đang tải...</div> :
          history.length === 0 ? <div className="text-sm text-gray-500">Chưa có lịch sử bán hàng</div> :
          <table className="w-full text-sm">
            <thead><tr className="table-header">
              <th className="text-left py-1 px-2">Mã HĐ</th>
              <th className="text-left py-1 px-2">Ngày bán</th>
              <th className="text-right py-1 px-2">SL</th>
              <th className="text-right py-1 px-2">Đơn giá</th>
              <th className="text-left py-1 px-2">Trạng thái</th>
            </tr></thead>
            <tbody>
              {history.map(h => (
                <tr key={h.MAHDB} className="border-b border-green-100">
                  <td className="py-1 px-2 font-mono text-xs">{h.MAHDB}</td>
                  <td className="py-1 px-2">{fmtDate(h.NGAYBAN)}</td>
                  <td className="py-1 px-2 text-right">{h.SOLUONG}</td>
                  <td className="py-1 px-2 text-right">{fmtCurrency(h.GIABAN)}</td>
                  <td className="py-1 px-2">
                    <span className={h.TRANGTHAI_HDB === 'Hoàn thành' ? 'badge-green' : 'badge-red'}>{h.TRANGTHAI_HDB}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </td>
    </tr>
  );
}

export default function HangHoa() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState({ 'Đang bán': true, 'Ngừng bán': false });
  const [filterTonkho, setFilterTonkho] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [modal, setModal] = useState(null); // {type: 'create'|'edit'|'delete', product?}

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const statuses = Object.entries(filterStatus).filter(([, v]) => v).map(([k]) => k).join(',');
      const res = await api.get('/hanghoa', {
        params: { page, limit: 15, search, trangthai: statuses, tonkho: filterTonkho }
      });
      setItems(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (e) {
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterTonkho]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
  const toggleStatus = (k) => { setFilterStatus(p => ({ ...p, [k]: !p[k] })); setPage(1); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Hàng hóa</h1>
        <button onClick={() => setModal({ type: 'create' })} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Tạo mới
        </button>
      </div>

      <div className="flex gap-4">
        {/* Sidebar filters */}
        <div className="w-52 shrink-0 space-y-4">
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
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Tồn kho</p>
            <select className="input-field text-sm" value={filterTonkho} onChange={e => { setFilterTonkho(e.target.value); setPage(1); }}>
              <option value="">Tất cả</option>
              <option value="du">Đủ hàng</option>
              <option value="thap">Sắp hết</option>
              <option value="het">Hết hàng</option>
            </select>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 space-y-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input-field pl-9" placeholder="Tìm theo tên hoặc mã sản phẩm..."
              value={search} onChange={handleSearch} />
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="text-left py-3 px-4">Mã SP</th>
                    <th className="text-left py-3 px-4">Tên sản phẩm</th>
                    <th className="text-right py-3 px-4">Giá bán</th>
                    <th className="text-right py-3 px-4">Giá nhập</th>
                    <th className="text-right py-3 px-4">Tồn kho</th>
                    <th className="text-center py-3 px-4">Trạng thái</th>
                    <th className="text-center py-3 px-4">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">Đang tải...</td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">Không có dữ liệu</td></tr>
                  ) : items.map(item => (
                    <React.Fragment key={item.MASP}>
                      <tr className="table-row cursor-pointer" onClick={() => setExpandedRow(expandedRow === item.MASP ? null : item.MASP)}>
                        <td className="py-3 px-4 font-mono text-xs text-gray-500">{item.MASP}</td>
                        <td className="py-3 px-4 font-medium">{item.TENSP}</td>
                        <td className="py-3 px-4 text-right text-green-700 font-semibold">{fmtCurrency(item.GIABAN)}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{fmtCurrency(item.GIANHAP)}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-semibold ${item.SL_TON === 0 ? 'text-red-600' : item.SL_TON <= item.DMUC_TON_MIN ? 'text-yellow-600' : 'text-gray-800'}`}>
                            {item.SL_TON}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={item.TRANGTHAI_SP === 'Đang bán' ? 'badge-green' : 'badge-red'}>{item.TRANGTHAI_SP}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setModal({ type: 'edit', product: item })}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Chỉnh sửa">
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => setModal({ type: 'delete', product: item })}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Ngừng bán">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => setExpandedRow(expandedRow === item.MASP ? null : item.MASP)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                              {expandedRow === item.MASP ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRow === item.MASP && <ExpandedRow product={item} />}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">Tổng: {total} sản phẩm</p>
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

      {modal?.type === 'create' && <ProductModal mode="create" onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal?.type === 'edit' && <ProductModal mode="edit" product={modal.product} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal?.type === 'delete' && <DeleteModal product={modal.product} onClose={() => setModal(null)} onDeleted={() => { setModal(null); load(); }} />}
    </div>
  );
}
