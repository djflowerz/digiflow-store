import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/store';
import { Modal, Button } from './UI';
import { Mail, Lock, Smartphone, RefreshCcw, Clock, ArrowLeft } from 'lucide-react';

const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, closeAuthModal, signIn, signInWithPhone, signUp, 
    verifyOtp, resendOtp, resetPassword 
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'verify' | 'forgot'>('signin');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend timer
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const resetForm = () => {
    setError(''); setInfo(''); setEmail(''); setPassword('');
    setPhone(''); setOtp(''); setResendCooldown(0);
    setMode('signin'); setLoginMethod('email');
  };

  const handleClose = () => {
    resetForm();
    closeAuthModal();
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true); setError(''); setInfo('');
    try {
      const res = await resendOtp(loginMethod === 'phone' ? phone : email, loginMethod === 'phone' ? 'sms' : 'signup');
      if (res.error) setError(res.error);
      else {
        setInfo(res.message || 'Verification code sent.');
        setResendCooldown(60);
      }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setInfo('');
    try {
      if (mode === 'signin') {
        if (loginMethod === 'email') {
          const { error } = await signIn(email, password);
          if (error) setError(error);
          else handleClose();
        } else {
          const { error, needVerification } = await signInWithPhone(phone);
          if (error) setError(error);
          else if (needVerification) {
            setMode('verify');
            setInfo(`Verification code sent to ${phone}`);
            setResendCooldown(60);
          }
        }
      } else if (mode === 'verify') {
        const type = loginMethod === 'phone' ? 'sms' : 'signup';
        const { error } = await verifyOtp(loginMethod === 'phone' ? phone : email, otp, type);
        if (error) setError(error);
        else handleClose();
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) setError(error);
        else setInfo(`Password reset link sent to ${email}`);
      }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isAuthModalOpen} onClose={handleClose} title={mode === 'signin' ? 'Sign In' : mode === 'verify' ? 'Verify' : mode === 'forgot' ? 'Reset Password' : 'Sign Up'} size="sm">
      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}
      {info && <div className="bg-blue-50 text-blue-600 p-3 rounded mb-4">{info}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signin' && loginMethod === 'email' && (
          <>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 p-2 border rounded" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 p-2 border rounded" required />
            </div>
          </>
        )}

        {mode === 'signin' && loginMethod === 'phone' && (
          <div className="relative">
            <Smartphone className="absolute left-3 top-3 text-gray-400" size={18} />
            <input type="tel" placeholder="Phone (+254...)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-10 p-2 border rounded" required />
          </div>
        )}

        {mode === 'verify' && (
          <div className="relative">
            <input type="text" placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} className="w-full p-2 border rounded text-center font-bold tracking-widest" maxLength={6} required />
            <div className="mt-2 text-sm text-gray-500 flex justify-between items-center">
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : <button type="button" onClick={handleResend}>Resend</button>}
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" isLoading={loading}>
          {mode === 'signin' ? (loginMethod === 'email' ? 'Sign In' : 'Send OTP') : mode === 'verify' ? 'Verify' : mode === 'forgot' ? 'Send Reset Link' : 'Sign Up'}
        </Button>
      </form>

      {mode === 'signin' && (
        <div className="mt-2 flex justify-between text-sm">
          <button type="button" onClick={() => setMode('forgot')} className="text-primary-600">Forgot Password?</button>
          <button type="button" onClick={() => setMode('signup')} className="text-primary-600">Sign Up</button>
        </div>
      )}
    </Modal>
  );
};

export default AuthModal;
