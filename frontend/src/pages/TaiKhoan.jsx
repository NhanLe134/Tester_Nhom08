import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, PencilIcon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function TaiKhoan() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('info');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ tenht: '', sdt: '' });
  const [editLoading, setEditLoading] = useState(false);

  const [pwForm, setPwForm] = useState({ matkhau_cu: '', matkhau_moi: '', xacnhan: '' });
  const [showPw, setShowPw] = useState({ cu: false, moi: false, xn: false });
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    api.get('/taikhoan/me')
      .then(r => { setProfile(r.data); setEditForm({ tenht: r.data.TENHT || '', sdt: r.data.SDT || '' }); })
      .catch(() => toast.error('Lỗi tải thông tin'))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await api.put('/taikhoan/me', editForm);
      setProfile(res.data);
      updateUser({ tenht: res.data.TENHT, sdt: res.data.SDT });
      toast.success('Cập nhật thông tin thành công');
      setShowEdit(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật');
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePw = async (e) => {
    e.preventDefault();
    if (pwForm.matkhau_moi !== pwForm.xacnhan) return toast.error('Mật khẩu xác nhận không khớp');
    setPwLoading(true);
    try {
      await api.put('/taikhoan/me/password', pwForm);
      toast.success('Đổi mật khẩu thành công');
      setPwForm({ matkhau_cu: '', matkhau_moi: '', xacnhan: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi đổi mật khẩu');
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Tài khoản</h1>

      {/* Sub-nav */}
      <div className="flex gap-1 border-b border-gray-200">
        {[{ k: 'info', l: 'Thông tin tài khoản' }, { k: 'password', l: 'Đổi mật khẩu' }].map(({ k, l }) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === k ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="card">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <UserCircleIcon className="w-12 h-12 text-green-600" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">{profile?.TENHT || profile?.TENDN}</h2>
                <button onClick={() => setShowEdit(true)} className="btn-secondary text-sm">
                  <PencilIcon className="w-4 h-4" /> Chỉnh sửa
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Tên đăng nhập</p>
                  <p className="font-medium text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">{profile?.TENDN}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Tên hiển thị</p>
                  <p className="font-medium text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">{profile?.TENHT || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Số điện thoại</p>
                  <p className="font-medium text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">{profile?.SDT || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Mã tài khoản</p>
                  <p className="font-mono text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">{profile?.MATK}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'password' && (
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4">Đổi mật khẩu</h2>
          <form onSubmit={handleChangePw} className="space-y-4 max-w-sm">
            {[
              { key: 'matkhau_cu', label: 'Mật khẩu cũ', showKey: 'cu' },
              { key: 'matkhau_moi', label: 'Mật khẩu mới', showKey: 'moi' },
              { key: 'xacnhan', label: 'Xác nhận mật khẩu mới', showKey: 'xn' },
            ].map(({ key, label, showKey }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <div className="relative">
                  <input
                    type={showPw[showKey] ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder={`Nhập ${label.toLowerCase()}`}
                    value={pwForm[key]}
                    onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                  />
                  <button type="button" onClick={() => setShowPw(p => ({ ...p, [showKey]: !p[showKey] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw[showKey] ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
            <button type="submit" disabled={pwLoading} className="btn-primary">
              {pwLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </button>
          </form>
        </div>
      )}

      {/* Edit modal */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-lg">Chỉnh sửa thông tin</h3>
              <button onClick={() => setShowEdit(false)}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                <input className="input-field bg-gray-50" value={profile?.TENDN} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị</label>
                <input className="input-field" placeholder="Nhập tên hiển thị"
                  value={editForm.tenht} onChange={e => setEditForm(p => ({ ...p, tenht: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input className="input-field" placeholder="Nhập số điện thoại" type="tel"
                  value={editForm.sdt} onChange={e => setEditForm(p => ({ ...p, sdt: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEdit(false)} className="btn-secondary flex-1 justify-center">Hủy</button>
                <button type="submit" disabled={editLoading} className="btn-primary flex-1 justify-center">
                  {editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
