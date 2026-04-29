import React, { useState, useRef, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  PlusIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon, ArrowPathIcon,
  PrinterIcon, ArrowUturnLeftIcon, Bars3Icon
} from '@heroicons/react/24/outline';

const fmtCurrency = (n) => new Intl.NumberFormat('vi-VN').format(n || 0);
const fmtDate = () => new Date().toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

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
      const res = await api.get('/hanghoa', { params: { search: q, limit: 10, trangthai: 'Đang bán' } });
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
    // Business Rule: Không được bán hàng khi tồn kho = 0.
    if (product.SL_TON <= 0) {
      toast.error('Sản phẩm đã hết hàng!');
      return;
    }
    updateTab(activeTab, (tab) => {
      const existing = tab.items.find(i => i.MASP === product.MASP);
      if (existing) {
        return { items: tab.items.map(i => i.MASP === product.MASP ? { ...i, SOLUONG: i.SOLUONG + 1 } : i) };
      }
      return { 
        items: [...tab.items, { 
          MASP: product.MASP, 
          TENSP: product.TENSP, 
          DVT: product.DVT, 
          GIABAN: product.GIABAN, 
          SOLUONG: 1, 
          SL_TON: product.SL_TON, 
          DMUC_TON_MIN: product.DMUC_TON_MIN 
        }] 
      };
    });
    setSearchQ('');
    setSearchResults([]);
    searchRef.current?.focus();
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      addItem(searchResults[0]);
    }
  };

  const updateQty = (masp, newQty) => {
    // Business Rule: Số lượng bán phải là số nguyên dương.
    const qty = parseInt(newQty);
    if (isNaN(qty) || qty < 1) return;
    
    updateTab(activeTab, (tab) => ({
      items: tab.items.map(i => i.MASP === masp ? { ...i, SOLUONG: qty } : i)
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

      // Handle warnings (Exception 8a)
      if (res.data.warnings && res.data.warnings.length > 0) {
        res.data.warnings.forEach(w => toast(w, { icon: '⚠️', duration: 4000 }));
      }

      setShowInvoice({ ...res.data, items: currentTab.items });
      updateTab(activeTab, () => ({ items: [], pttt: 'Tiền mặt' }));
      toast.success('Thanh toán thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || `Lưu hóa đơn thất bại`);
    } finally {
      setPaying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className={showInvoice ? 'no-print' : ''}>
        {/* Header */}
        <div className="bg-green-600 px-4 py-2 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              ref={searchRef}
              className="w-full bg-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" 
              placeholder="Quét mã hàng hoặc tìm tên (F7)"
              value={searchQ} 
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
            />
            {searchQ.trim() && !searching && searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4 text-center text-gray-500 text-sm">
                Không tìm thấy hàng hóa
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                {searchResults.map(p => (
                  <button key={p.MASP} onClick={() => addItem(p)}
                    className="w-full text-left px-4 py-3 hover:bg-green-50 flex items-center justify-between text-sm border-b border-gray-100 last:border-0">
                    <div>
                      <div className="font-medium text-gray-800">{p.TENSP}</div>
                      <div className="text-xs text-gray-500">{p.MASP} • Còn: {p.SL_TON}</div>
                    </div>
                    <div className="text-green-700 font-semibold">{fmtCurrency(p.GIABAN)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1">
            {tabs.map(tab => (
              <div key={tab.id} 
                className={`flex items-center gap-2 px-4 py-1.5 rounded-t-lg text-sm font-medium cursor-pointer transition-colors ${
                  activeTab === tab.id ? 'bg-white text-gray-800' : 'bg-green-700 text-white hover:bg-green-500'
                }`}
                onClick={() => setActiveTab(tab.id)}>
                {tab.label}
                {tabs.length > 1 && (
                  <button onClick={e => { e.stopPropagation(); removeTab(tab.id); }}
                    className="hover:text-red-500">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addTab} className="p-1.5 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors">
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <span className="text-white font-medium">Chủ Tiệm</span>
          <button className="p-2 text-white hover:bg-green-700 rounded-lg transition-colors">
            <Bars3Icon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Product list */}
        <div className="flex-1 bg-gray-100 p-4 overflow-y-auto">
          {currentTab?.items.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p>Tìm và thêm sản phẩm vào hóa đơn</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {currentTab.items.map((item, idx) => (
                <div key={item.MASP} className="bg-white rounded-lg p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                  {/* STT */}
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                    {idx + 1}
                  </div>

                  {/* Delete button */}
                  <button onClick={() => removeItem(item.MASP)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                    <TrashIcon className="w-5 h-5" />
                  </button>

                  {/* Product info */}
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{item.MASP}</div>
                    <div className="text-sm text-gray-600">{item.TENSP}</div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateQty(item.MASP, item.SOLUONG - 1)}
                        className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-gray-600 font-bold">
                        −
                      </button>
                      <input 
                        type="number" 
                        value={item.SOLUONG}
                        onChange={(e) => updateQty(item.MASP, e.target.value)}
                        className={`w-12 text-center border border-gray-300 rounded py-1 font-semibold ${item.SOLUONG > item.SL_TON ? 'text-red-600 border-red-500' : ''}`}
                      />
                      <button 
                        onClick={() => updateQty(item.MASP, item.SOLUONG + 1)}
                        className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-gray-600 font-bold">
                        +
                      </button>
                    </div>
                    {item.SOLUONG > item.SL_TON && (
                      <span className="text-[10px] text-red-500 font-medium">Vượt tồn kho</span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-right min-w-[100px]">
                    <div className="text-sm text-gray-500">{fmtCurrency(item.GIABAN)}</div>
                    <div className="font-bold text-green-700">{fmtCurrency(item.SOLUONG * item.GIABAN)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Payment panel */}
        <div className="w-[420px] bg-gray-50 p-6 flex flex-col">
          {/* White card container */}
          <div className="bg-white rounded-3xl shadow-sm flex flex-col">
            {/* Date/Time */}
            <div className="px-8 pt-6 pb-4 text-right text-sm text-gray-400">
              {fmtDate()}
            </div>

            {/* Summary */}
            <div className="px-8 pb-6 space-y-5">
              {/* Tổng tiền hàng */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center">
                <span className="text-gray-600 text-sm">Tổng tiền hàng</span>
                <span className="text-gray-400 text-sm text-right w-12">{currentTab?.items.reduce((s, i) => s + i.SOLUONG, 0) || 0}</span>
                <span className="font-bold text-lg text-gray-800 text-right w-24">{fmtCurrency(total)}</span>
              </div>


              {/* Payment method */}
              <div className="pt-3">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="pttt" 
                      value="Tiền mặt"
                      checked={currentTab?.pttt === 'Tiền mặt'}
                      onChange={() => updateTab(activeTab, () => ({ pttt: 'Tiền mặt' }))}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                    />
                    <span className="text-sm text-gray-700">Tiền mặt</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="pttt" 
                      value="Chuyển khoản"
                      checked={currentTab?.pttt === 'Chuyển khoản'}
                      onChange={() => updateTab(activeTab, () => ({ pttt: 'Chuyển khoản' }))}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                    />
                    <span className="text-sm text-gray-700">Chuyển khoản (QR)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Payment button */}
            <div className="px-8 pb-8 pt-6">
              <button 
                onClick={handlePay} 
                disabled={paying || !currentTab?.items.length}
                className="w-full bg-green-400 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-base transition-colors uppercase shadow-sm">
                {paying ? 'Đang xử lý...' : 'Thanh toán'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Invoice modal */}
      {showInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:p-0 print:static print:bg-white">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md print:shadow-none print:max-w-none print:w-[80mm] print:mx-auto">
            <div className="p-6 border-b flex items-center justify-between no-print">
              <h3 className="font-bold text-lg">Hóa đơn bán hàng</h3>
              <button onClick={() => setShowInvoice(null)}>
                <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-green-700">CHỦ TIỆM NGA</h2>
                <p className="text-sm text-gray-500">HÓA ĐƠN BÁN HÀNG</p>
                <p className="text-xs text-gray-400 mt-1">Mã HĐ: {showInvoice.MAHDB}</p>
                <p className="text-xs text-gray-400">{fmtDate()}</p>
              </div>
              <div className="border-t border-dashed pt-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500">
                      <th className="text-left pb-1">Tên hàng</th>
                      <th className="text-center pb-1">SL</th>
                      <th className="text-right pb-1">Đơn giá</th>
                      <th className="text-right pb-1">T.Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showInvoice.items.map(i => (
                      <tr key={i.MASP} className="border-t border-gray-100">
                        <td className="py-1">{i.TENSP}</td>
                        <td className="py-1 text-center">{i.SOLUONG}</td>
                        <td className="py-1 text-right">{fmtCurrency(i.GIABAN)}</td>
                        <td className="py-1 text-right font-medium">{fmtCurrency(i.SOLUONG * i.GIABAN)}</td>
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
                  <span>Thanh toán:</span>
                  <span>{showInvoice.PTTT}</span>
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 border-t pt-3">Cảm ơn quý khách! Hẹn gặp lại 😊</p>
            </div>
            <div className="p-4 border-t flex gap-3 no-print">
              <button onClick={() => setShowInvoice(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Đóng
              </button>
              <button onClick={handlePrint} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                <PrinterIcon className="w-4 h-4" /> In hóa đơn (P)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
