import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { LockClosedIcon, EyeIcon, EyeSlashIcon, PhoneIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ tendn: '', matkhau: '' });
  const [showPw, setShowPw] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1=phone, 2=otp+newpw
  const [forgotData, setForgotData] = useState({ sdt: '', otp: '', otp_demo: '', matkhau_moi: '', xacnhan: '' });
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.tendn || !form.matkhau) return toast.error('Vui lòng nhập đầy đủ thông tin');
    const result = await login(form.tendn, form.matkhau);
    if (result.success) {
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } else {
      toast.error(result.message);
    }
  };

  const handleForgotPhone = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { sdt: forgotData.sdt });
      setForgotData(d => ({ ...d, otp_demo: res.data.otp_demo }));
      setForgotStep(2);
      toast.success('Mã OTP đã được gửi (demo: ' + res.data.otp_demo + ')');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi gửi OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (forgotData.matkhau_moi !== forgotData.xacnhan) return toast.error('Mật khẩu xác nhận không khớp');
    setForgotLoading(true);
    try {
      await api.post('/auth/verify-otp', {
        sdt: forgotData.sdt,
        otp: forgotData.otp,
        matkhau_moi: forgotData.matkhau_moi
      });
      toast.success('Đặt lại mật khẩu thành công!');
      setShowForgot(false);
      setForgotStep(1);
      setForgotData({ sdt: '', otp: '', otp_demo: '', matkhau_moi: '', xacnhan: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xác thực OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-green-600 items-center justify-center p-12">
        <div className="text-center text-white">
          <div className="text-9xl mb-6">🛒</div>
          <h1 className="text-4xl font-bold mb-3">Tiệm Tạp Hóa</h1>
          <p className="text-green-100 text-lg">Hệ thống quản lý bán hàng thông minh</p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {['📦 Quản lý hàng hóa', '🧾 Hóa đơn bán hàng', '📊 Báo cáo doanh thu'].map(t => (
              <div key={t} className="bg-green-700 rounded-xl p-3 text-sm">{t}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🛒</div>
            <h2 className="text-3xl font-bold text-gray-800">Chào mừng!</h2>
            <p className="text-gray-500 mt-1">Đăng nhập để tiếp tục</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-lg p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
              <input
                type="text"
                className="input-field"
                placeholder="Nhập tên đăng nhập"
                value={form.tendn}
                onChange={e => setForm(f => ({ ...f, tendn: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Nhập mật khẩu"
                  value={form.matkhau}
                  onChange={e => setForm(f => ({ ...f, matkhau: e.target.value }))}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <button type="button" onClick={() => setShowForgot(true)}
                className="text-sm text-red-500 hover:text-red-700 font-medium">
                Quên mật khẩu?
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full btn-primary justify-center py-3 text-base">
              <LockClosedIcon className="w-5 h-5" />
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            Demo: admin / Admin123
          </p>
        </div>
      </div>

      {/* Forgot password modal */}
      {showForgot && (
        <div className="modal-overlay" onClick={() => setShowForgot(false)}>
          <div className="modal-box p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {forgotStep === 1 ? 'Quên mật khẩu' : 'Xác thực OTP'}
            </h3>

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotPhone} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại đăng ký</label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="tel" className="input-field pl-9" placeholder="Nhập số điện thoại"
                      value={forgotData.sdt} onChange={e => setForgotData(d => ({ ...d, sdt: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowForgot(false)} className="btn-secondary flex-1 justify-center">Hủy</button>
                  <button type="submit" disabled={forgotLoading} className="btn-primary flex-1 justify-center">
                    {forgotLoading ? 'Đang gửi...' : 'Gửi OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {forgotData.otp_demo && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    <strong>Demo OTP:</strong> {forgotData.otp_demo}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã OTP</label>
                  <input type="text" className="input-field" placeholder="Nhập mã OTP 6 số"
                    value={forgotData.otp} onChange={e => setForgotData(d => ({ ...d, otp: e.target.value }))} maxLength={6} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                  <input type="password" className="input-field" placeholder="Nhập mật khẩu mới"
                    value={forgotData.matkhau_moi} onChange={e => setForgotData(d => ({ ...d, matkhau_moi: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
                  <input type="password" className="input-field" placeholder="Nhập lại mật khẩu mới"
                    value={forgotData.xacnhan} onChange={e => setForgotData(d => ({ ...d, xacnhan: e.target.value }))} />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setForgotStep(1)} className="btn-secondary flex-1 justify-center">Quay lại</button>
                  <button type="submit" disabled={forgotLoading} className="btn-primary flex-1 justify-center">
                    {forgotLoading ? 'Đang xử lý...' : 'Xác nhận'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
