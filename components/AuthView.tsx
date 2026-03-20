import React, { useState } from 'react';
import { Apple, MessageCircle, X, Check, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';

interface AuthViewProps {
  onLoginSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginMethod, setLoginMethod] = useState<'sms' | 'password'>('sms');
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(''); // Used for password login or verify code for sms
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetForm = () => {
      setError('');
      setSuccessMsg('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
  };

  const handleAction = async () => {
    setError('');
    setSuccessMsg('');
    
    if (!phone) {
        setError('请输入手机号码');
        return;
    }
    if (!password) {
        setError(mode === 'login' && loginMethod === 'sms' ? '请输入验证码' : '请输入密码');
        return;
    }

    setLoading(true);

    try {
        if (mode === 'register') {
            if (password !== confirmPassword) {
                setError('两次输入的密码不一致');
                setLoading(false);
                return;
            }
            const res = await authService.register(phone, password);
            if (res.success) {
                setSuccessMsg('注册成功，请登录');
                setTimeout(() => {
                    setMode('login');
                    setLoginMethod('password'); // Auto switch to password login after register
                    resetForm();
                    // Keep the phone number filled for convenience
                    setPhone(phone); 
                }, 1500);
            } else {
                setError(res.message);
            }
        } else {
            // Login Mode
            let res;
            if (loginMethod === 'sms') {
                res = await authService.loginBySMS(phone, password);
            } else {
                res = await authService.loginByPassword(phone, password);
            }

            if (res.success) {
                onLoginSuccess();
            } else {
                setError(res.message);
            }
        }
    } catch (e) {
        setError('发生未知错误');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-900 font-sans animate-in fade-in duration-500">
      
      {/* Main Container */}
      <div className="w-full max-w-[420px] px-8 flex flex-col items-center">
        
        {/* Header Titles */}
        <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">欢迎使用微秘</h1>
            <p className="text-gray-500 text-sm">登录后可同步各端数据</p>
        </div>

        {/* Login Tabs (Only show in Login Mode) */}
        {mode === 'login' && (
            <div className="flex items-center gap-8 mb-8 text-sm font-medium">
                <button 
                    onClick={() => { setLoginMethod('sms'); setError(''); }}
                    className={`pb-2 transition-all ${loginMethod === 'sms' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    短信登录
                </button>
                <button 
                    onClick={() => { setLoginMethod('password'); setError(''); }}
                    className={`pb-2 transition-all ${loginMethod === 'password' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    账号登录
                </button>
                <button className="pb-2 text-gray-500 hover:text-gray-700 cursor-not-allowed opacity-50">
                    扫一扫登录
                </button>
            </div>
        )}

        {/* Register Title (Only show in Register Mode) */}
        {mode === 'register' && (
             <div className="flex items-center gap-8 mb-8 text-sm font-medium">
                <span className="pb-2 text-purple-600 border-b-2 border-purple-600">
                    注册新账号
                </span>
            </div>
        )}

        {/* Forms */}
        <div className="w-full space-y-4 mb-8">
            <div className="group relative">
                <span className="absolute left-4 top-3 text-gray-400 text-sm border-r border-gray-200 pr-3">+86</span>
                <input 
                    type="text" 
                    placeholder="输入手机号码" 
                    className="w-full pl-20 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-all placeholder:text-gray-300"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                />
            </div>

            <div className="relative flex items-center">
                <input 
                    type={mode === 'login' && loginMethod === 'sms' ? "text" : "password"} 
                    placeholder={mode === 'login' && loginMethod === 'sms' ? "验证码" : "密码"}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-all placeholder:text-gray-300"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAction()}
                />
                {mode === 'login' && loginMethod === 'sms' && (
                    <button className="absolute right-3 text-sm text-purple-600 hover:text-purple-700 font-medium">
                        获取验证码
                    </button>
                )}
            </div>

            {mode === 'register' && (
                <div className="relative flex items-center animate-in slide-in-from-top-2">
                    <input 
                        type="password"
                        placeholder="确认密码"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 transition-all placeholder:text-gray-300"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAction()}
                    />
                </div>
            )}
        </div>

        {/* Error / Success Messages */}
        {error && (
            <div className="w-full mb-4 p-2 bg-red-50 text-red-500 text-xs rounded flex items-center gap-2">
                <X size={12} /> {error}
            </div>
        )}
        {successMsg && (
            <div className="w-full mb-4 p-2 bg-green-50 text-green-600 text-xs rounded flex items-center gap-2">
                <Check size={12} /> {successMsg}
            </div>
        )}

        {/* Main Button */}
        <button 
            onClick={handleAction}
            disabled={loading}
            className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white py-3 rounded-lg font-medium shadow-sm transition-all transform active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {mode === 'login' ? '立即登录' : '立即注册'}
        </button>

        {/* Divider */}
        <div className="w-full my-10 flex items-center justify-center relative">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
            </div>
            <span className="relative bg-white px-4 text-xs text-gray-400">或</span>
        </div>

        {/* Social Login */}
        <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Apple size={18} className="text-gray-900" />
                <span className="text-xs text-gray-600 font-medium">Apple ID登录</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <MessageCircle size={18} className="text-green-600" />
                <span className="text-xs text-gray-600 font-medium">微信登录</span>
            </button>
        </div>

        {/* Footer Links */}
        <div className="mt-16 flex items-center gap-4 text-xs text-gray-400">
             <button 
                onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    resetForm();
                }}
                className="hover:text-purple-600 transition-colors"
            >
                {mode === 'login' ? '注册账号' : '返回登录'}
            </button>
             <div className="h-3 w-px bg-gray-200"></div>
             <button className="hover:text-purple-600 transition-colors">忘记密码</button>
        </div>
      </div>
    </div>
  );
};
