import React, { useState, useRef, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  PlusIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon,
  PrinterIcon, QrCodeIcon
} from '@heroicons/react/24/outline';

const fmtCurrency = (n) => new Intl.NumberFormat('vi-VN').format(n || 0) + ' đ';

let tabCounter = 2;

function createTab(id) {
  return { id, label: `Hóa đơn ${id}`, items: [], pttt: 'Tiền mặt', khachTT: '' };
}

export default function BanHang() {
  const [tabs, setTabs] = useState([createTab(1)]);
  const [activeTab, setActiveTab] = useState(1);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showInvoice, setShowInvoice] = useState(null);
  const [paying, setPaying] = useState(false);
  const searchRef = useRef(null);
  const printRef = useRef(null);

  const currentTab = tabs.find(t => t.id === activeTab);

  const updateTab = (id, updater) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updater(t) } : t));
  };

  const addTab = () => {
    const id = tabCounter++;
    setTabs(prev => [...prev, createTab(id)]);
    setActiveTab(id);
  };

  const removeTab = (id) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTab === id) setActiveTab(newTabs[newTabs.length - 1].id);
  };

  const searchProducts = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get('/hanghoa', { params: { search: q, limit: 8, trangthai: 'Đang bán' } });
      setSearchResults(res.data.items);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }, []);

  const handleSearchChange = (e) => {
    const v = e.target.value;
    setSearchQ(v);
    searchProducts(v);
  };

  const addItem = (product) => {
    updateTab(activeTab, (tab) => {
      const existing = tab.items.find(i => i.MASP === product.MASP);
      if (existing) {
        return { items: tab.items.map(i => i.MASP === product.MASP ? { ...i, SOLUONG: i.SOLUONG + 1 } : i) };
      }
      return { items: [...tab.items, { MASP: product.MASP, TENSP: product.TENSP, DVT: product.DVT, GIABAN: product.GIABAN, SOLUONG: 1, SL_TON: product.SL_TON }] };
    });
    setSearchQ('');
    setSearchResults([]);
    searchRef.current?.focus();
  };

  const updateQty = (masp, delta) => {
    updateTab(activeTab, (tab) => ({
      items: tab.items.map(i => i.MASP === masp
        ? { ...i, SOLUONG: Math.max(1, i.SOLUONG + delta) }
        : i
      ).filter(i => i.SOLUONG > 0)
    }));
  };

  const removeItem = (masp) => {
    updateTab(activeTab, (tab) => ({ items: tab.items.filter(i => i.MASP !== masp) }));
  };

  const total = currentTab?.items.reduce((s, i) => s + i.SOLUONG * i.GIABAN, 0) || 0;
  const khachTT = parseFloat(currentTab?.khachTT) || 0;
  const tienThua = khachTT - total;

  const handlePay = async () => {
    if (!currentTab?.items.length) return toast.error('Chưa có sản phẩm trong hóa đơn');
    setPaying(true);
    try {
      const res = await api.post('/hoadonban', {
        items: currentTab.items.map(i => ({ MASP: i.MASP, SOLUONG: i.SOLUONG, GIABAN: i.GIABAN })),
        pttt: currentTab.pttt,
      });
      setShowInvoice({ ...res.data, khachTT, tienThua, items: currentTab.items });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi tạo hóa đơn');
    } finally {
      setPaying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCloseInvoice = () => {
    // Clear current tab
    updateTab(activeTab, () => ({ items: [], khachTT: '' }));
    setShowInvoice(null);
    toast.success('Thanh toán thành công!');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Bán hàng</h1>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {tabs.map(tab => (
          <div key={tab.id} className={`flex items-center gap-1 px-4 py-2 rounded-t-lg text-sm font-medium cursor-pointer border-b-2 transition-colors ${activeTab === tab.id ? 'border-green-600 text-green-700 bg-green-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab(tab.id)}>
            {tab.label}
            {tabs.length > 1 && (
              <button onClick={e => { e.stopPropagation(); removeTab(tab.id); }}
                className="ml-1 hover:text-red-500"><XMarkIcon className="w-3.5 h-3.5" /></button>
            )}
          </div>
        ))}
        <button onClick={addTab} className="px-3 py-2 text-gray-400 hover:text-green-600 text-lg font-bold">+</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: product search + order table */}
        <div className="lg:col-span-2 space-y-3">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input ref={searchRef} className="input-field pl-9 pr-10" placeholder="Tìm sản phẩm theo tên hoặc mã..."
              value={searchQ} onChange={handleSearchChange} />
            <QrCodeIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer" title="Quét mã vạch" />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                {searching && <div className="p-3 text-sm text-gray-400">Đang tìm...</div>}
                {searchResults.map(p => (
                  <button key={p.MASP} onClick={() => addItem(p)}
                    className="w-full text-left px-4 py-2.5 hover:bg-green-50 flex items-center justify-between text-sm border-b border-gray-50 last:border-0">
                    <div>
                      <span className="font-medium">{p.TENSP}</span>
                      <span className="text-xs text-gray-400 ml-2">{p.MASP}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-green-700 font-semibold">{fmtCurrency(p.GIABAN)}</div>
                      <div className="text-xs text-gray-400">Còn: {p.SL_TON}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Order table */}
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left py-3 px-4 w-8">STT</th>
                  <th className="text-left py-3 px-4">Mã hàng</th>
                  <th className="text-left py-3 px-4">Tên hàng</th>
                  <th className="text-center py-3 px-4">SL</th>
                  <th className="text-right py-3 px-4">Đơn giá</th>
                  <th className="text-right py-3 px-4">Thành tiền</th>
                  <th className="py-3 px-4 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {currentTab?.items.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                    Tìm và thêm sản phẩm vào hóa đơn
                  </td></tr>
                ) : currentTab.items.map((item, idx) => (
                  <tr key={item.MASP} className="table-row">
                    <td className="py-2 px-4 text-gray-400">{idx + 1}</td>
                    <td className="py-2 px-4 font-mono text-xs text-gray-500">{item.MASP}</td>
                    <td className="py-2 px-4 font-medium">{item.TENSP}</td>
                    <td className="py-2 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => updateQty(item.MASP, -1)}
                          className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-gray-600 font-bold">−</button>
                        <span className="w-8 text-center font-semibold">{item.SOLUONG}</span>
                        <button onClick={() => updateQty(item.MASP, 1)}
                          className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-gray-600 font-bold">+</button>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-right">{fmtCurrency(item.GIABAN)}</td>
                    <td className="py-2 px-4 text-right font-semibold text-green-700">{fmtCurrency(item.SOLUONG * item.GIABAN)}</td>
                    <td className="py-2 px-4">
                      <button onClick={() => removeItem(item.MASP)} className="text-red-400 hover:text-red-600">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: payment panel */}
        <div className="space-y-3">
          <div className="card space-y-4">
            <h3 className="font-semibold text-gray-700">Thanh toán</h3>

            {/* Payment method */}
            <div>
              <p className="text-sm text-gray-500 mb-2">Phương thức thanh toán</p>
              <div className="flex gap-3">
                {['Tiền mặt', 'Chuyển khoản'].map(m => (
                  <label key={m} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="pttt" value={m}
                      checked={currentTab?.pttt === m}
                      onChange={() => updateTab(activeTab, () => ({ pttt: m }))}
                      className="text-green-600 focus:ring-green-500" />
                    <span className="text-sm">{m}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tổng tiền hàng</span>
                <span className="font-semibold">{fmtCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-2">
                <span>Khách cần trả</span>
                <span className="text-green-700">{fmtCurrency(total)}</span>
              </div>
            </div>

            {/* Customer payment input */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">Khách thanh toán</label>
              <input type="number" className="input-field text-right font-semibold text-lg"
                placeholder="0"
                value={currentTab?.khachTT || ''}
                onChange={e => updateTab(activeTab, () => ({ khachTT: e.target.value }))} />
            </div>

            {khachTT > 0 && (
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-gray-500">Tiền thừa</span>
                <span className={tienThua >= 0 ? 'text-green-700' : 'text-red-600'}>{fmtCurrency(Math.max(0, tienThua))}</span>
              </div>
            )}

            <button onClick={handlePay} disabled={paying || !currentTab?.items.length}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-base transition-colors">
              {paying ? 'Đang xử lý...' : '💳 THANH TOÁN'}
            </button>
          </div>
        </div>
      </div>

      {/* Invoice preview modal */}
      {showInvoice && (
        <div className="modal-overlay">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md" ref={printRef}>
            <div className="p-6 no-print flex items-center justify-between border-b">
              <h3 className="font-bold text-lg">Hóa đơn bán hàng</h3>
              <button onClick={() => setShowInvoice(null)}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4" id="invoice-print">
              <div className="text-center">
                <h2 className="text-xl font-bold text-green-700">🛒 TIỆM TẠP HÓA</h2>
                <p className="text-sm text-gray-500">HÓA ĐƠN BÁN HÀNG</p>
                <p className="text-xs text-gray-400 mt-1">Mã HĐ: {showInvoice.MAHDB}</p>
                <p className="text-xs text-gray-400">{new Date(showInvoice.NGAYBAN).toLocaleString('vi-VN')}</p>
              </div>
              <div className="border-t border-dashed pt-3">
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-gray-500">
                    <th className="text-left pb-1">Tên hàng</th>
                    <th className="text-center pb-1">SL</th>
                    <th className="text-right pb-1">Đơn giá</th>
                    <th className="text-right pb-1">T.Tiền</th>
                  </tr></thead>
                  <tbody>
                    {showInvoice.items.map(i => (
                      <tr key={i.MASP} className="border-t border-gray-100">
                        <td className="py-1">{i.TENSP}</td>
                        <td className="py-1 text-center">{i.SOLUONG}</td>
                        <td className="py-1 text-right">{new Intl.NumberFormat('vi-VN').format(i.GIABAN)}</td>
                        <td className="py-1 text-right font-medium">{new Intl.NumberFormat('vi-VN').format(i.SOLUONG * i.GIABAN)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-dashed pt-3 space-y-1 text-sm">
                <div className="flex justify-between font-bold text-base">
                  <span>Tổng cộng:</span>
                  <span className="text-green-700">{fmtCurrency(showInvoice.TONGTIENHANG_BAN)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Khách trả:</span>
                  <span>{fmtCurrency(showInvoice.khachTT)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Tiền thừa:</span>
                  <span>{fmtCurrency(Math.max(0, showInvoice.tienThua))}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Thanh toán:</span>
                  <span>{showInvoice.PTTT}</span>
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 border-t pt-3">Cảm ơn quý khách! Hẹn gặp lại 😊</p>
            </div>
            <div className="p-4 border-t flex gap-3 no-print">
              <button onClick={handleCloseInvoice} className="btn-secondary flex-1 justify-center">Đóng</button>
              <button onClick={handlePrint} className="btn-primary flex-1 justify-center">
                <PrinterIcon className="w-4 h-4" /> In hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
