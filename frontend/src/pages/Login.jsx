import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { PhoneIcon } from '@heroicons/react/24/outline';

const Squiggle = ({ color, style, rotate = 0 }) => (
  <svg viewBox="0 0 80 30" style={{ ...style, transform: `rotate(${rotate}deg)` }} className="absolute pointer-events-none">
    <path d="M5 15 Q20 0 35 15 Q50 30 65 15 Q72 8 75 15"
      stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />
  </svg>
);

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ tendn: '', matkhau: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotData, setForgotData] = useState({ sdt: '', otp: '', otp_demo: '', matkhau_moi: '', xacnhan: '' });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetErrors, setResetErrors] = useState({});
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef(null);

  const startCountdown = () => {
    setCountdown(60);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(countdownRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleLogin = async (e) => {
    // CHẶN RELOAD: Quan trọng nhất nếu e tồn tại
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
      e.stopPropagation();
    }

    setErrorMsg('');

    if (!form.tendn) {
      setErrorMsg('Vui lòng nhập tên đăng nhập');
      return;
    }
    if (!form.matkhau) {
      setErrorMsg('Vui lòng nhập mật khẩu');
      return;
    }

    try {
      // Gọi hàm login từ Context
      const result = await login(form.tendn, form.matkhau);

      if (result.success) {
        toast.success('Đăng nhập thành công!');
        navigate('/');
      } else {
        // Hiển thị lỗi ngay dưới ô nhập, không lo bị reload làm mất
        setErrorMsg('Sai tên đăng nhập hoặc mật khẩu');
      }
    } catch (err) {
      setErrorMsg('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    }
  };

  const closeForgot = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowForgot(false);
    setForgotStep(1);
    setForgotData({ sdt: '', otp: '', otp_demo: '', matkhau_moi: '', xacnhan: '' });
    setCountdown(0);
    setResetErrors({});
  };

  const handleSendOTP = async () => {
    if (!forgotData.sdt) {
      setResetErrors({ sdt: 'Vui lòng nhập số điện thoại' });
      return;
    }
    setForgotLoading(true);
    setResetErrors({});
    try {
      const res = await api.post('/auth/forgot-password', { sdt: forgotData.sdt });
      toast.success(res.data.message);
      setForgotData(d => ({ ...d, otp_demo: res.data.otp_demo }));
      setForgotStep(2);
      startCountdown();
    } catch (err) {
      setResetErrors({ sdt: err.response?.data?.message || 'Có lỗi xảy ra' });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const { sdt, otp, matkhau_moi, xacnhan } = forgotData;
    if (!otp) {
      setResetErrors({ otp: 'Vui lòng nhập mã OTP' });
      return;
    }
    if (!matkhau_moi) {
      setResetErrors({ matkhau_moi: 'Vui lòng nhập mật khẩu mới' });
      return;
    }
    if (!xacnhan) {
      setResetErrors({ xacnhan: 'Vui lòng xác nhận mật khẩu' });
      return;
    }
    setForgotLoading(true);
    setResetErrors({});
    try {
      await api.post('/auth/reset-password', { sdt, matkhau_moi, xacnhan });
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
      closeForgot();
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.field) {
        setResetErrors({ [errData.field]: errData.message });
      } else {
        setResetErrors({ general: errData?.message || 'Có lỗi xảy ra' });
      }
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #f0f4e8 0%, #fdf0f0 50%, #f0f4e8 100%)' }}>

      {/* Font bảo mật mật khẩu */}
      <style>{`
        .no-save-password {
          -webkit-text-security: disc !important;
          text-security: disc !important;
        }
      `}</style>

      <Squiggle color="#d4f0a0" style={{ width: 90, top: '6%', left: '3%' }} rotate={-20} />
      <Squiggle color="#ffe066" style={{ width: 70, top: '14%', left: '6%' }} rotate={10} />
      <Squiggle color="#a8e6f0" style={{ width: 80, top: '4%', left: '22%' }} rotate={5} />
      <Squiggle color="#f0a8c8" style={{ width: 100, top: '3%', right: '8%' }} rotate={-15} />

      <div className="relative z-10 bg-white rounded-3xl shadow-xl flex overflow-hidden"
        style={{ width: 960, minHeight: 500 }}>

        <div className="flex items-center justify-center rounded-2xl m-5 overflow-hidden"
          style={{ background: '#f5c8c8', width: 400, minHeight: 440, flexShrink: 0 }}>
          <img src="/cart.png" alt="shopping cart" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div className="flex flex-col justify-center px-10 py-10 flex-1">
          <h1 className="mb-6" style={{ fontFamily: "'Caveat', cursive", fontSize: 52, fontWeight: 700, color: '#1a1a1a' }}>Welcome!</h1>

          {/* Dùng DIV thay vì FORM để triệt tiêu mọi khả năng tự động reload của trình duyệt */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Tên đăng nhập"
              value={form.tendn}
              onChange={e => {
                setForm(f => ({ ...f, tendn: e.target.value }));
                setErrorMsg('');
              }}
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-gray-700 placeholder-gray-400 focus:border-green-400 transition"
              style={{ fontSize: 15 }}
            />

            <input
              type="text"
              placeholder="Mật khẩu"
              value={form.matkhau}
              onChange={e => {
                setForm(f => ({ ...f, matkhau: e.target.value }));
                setErrorMsg('');
              }}
              onKeyDown={(e) => {
                // Nhấn Enter vẫn đăng nhập được nhưng không reload
                if (e.key === 'Enter') handleLogin();
              }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-gray-700 placeholder-gray-400 focus:border-green-400 transition no-save-password"
              style={{ fontSize: 15 }}
            />

            {/* Khu vực thông báo lỗi cố định */}
            <div className="h-6">
              {errorMsg && (
                <p className="text-red-500 text-sm font-semibold">
                  {errorMsg}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => setShowForgot(true)}
                className="text-sm text-red-500 hover:text-red-700">
                Quên mật khẩu ?
              </button>

              <button
                type="button"
                onClick={(e) => handleLogin(e)}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-60"
                style={{ background: '#22c55e' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" />
                </svg>
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap" rel="stylesheet" />

      {/* Forgot Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeForgot}>
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Quên mật khẩu</h3>
            
            {forgotStep === 1 && (
              <div className="space-y-4">
                <p className="text-gray-600 text-sm mb-4">Nhập số điện thoại đã đăng ký để nhận mã OTP.</p>
                <div>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Nhập số điện thoại"
                      value={forgotData.sdt}
                      onChange={e => setForgotData(d => ({ ...d, sdt: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-green-400 transition"
                    />
                  </div>
                  {resetErrors.sdt && <p className="text-red-500 text-sm mt-1">{resetErrors.sdt}</p>}
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeForgot}
                    className="flex-1 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={forgotLoading}
                    className="flex-1 px-6 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition disabled:opacity-60"
                  >
                    {forgotLoading ? 'Đang gửi...' : 'Nhận OTP'}
                  </button>
                </div>
              </div>
            )}

            {forgotStep === 2 && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Mã OTP demo:</strong> <span className="font-mono font-bold">{forgotData.otp_demo}</span>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    (Trong môi trường thực tế, mã này sẽ được gửi qua SMS)
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Nhập mã OTP"
                    value={forgotData.otp}
                    onChange={e => setForgotData(d => ({ ...d, otp: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-green-400 transition"
                  />
                  {resetErrors.otp && <p className="text-red-500 text-sm mt-1">{resetErrors.otp}</p>}
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="Mật khẩu mới"
                    value={forgotData.matkhau_moi}
                    onChange={e => setForgotData(d => ({ ...d, matkhau_moi: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-green-400 transition"
                  />
                  {resetErrors.matkhau_moi && <p className="text-red-500 text-sm mt-1">{resetErrors.matkhau_moi}</p>}
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="Xác nhận mật khẩu"
                    value={forgotData.xacnhan}
                    onChange={e => setForgotData(d => ({ ...d, xacnhan: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-green-400 transition"
                  />
                  {resetErrors.xacnhan && <p className="text-red-500 text-sm mt-1">{resetErrors.xacnhan}</p>}
                </div>

                {resetErrors.general && (
                  <p className="text-red-500 text-sm text-center">{resetErrors.general}</p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-600 pt-2">
                  {countdown > 0 ? (
                    <span>Gửi lại sau {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      className="text-green-600 hover:text-green-700 font-semibold"
                    >
                      Gửi lại OTP
                    </button>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeForgot}
                    className="flex-1 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={forgotLoading}
                    className="flex-1 px-6 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition disabled:opacity-60"
                  >
                    {forgotLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}