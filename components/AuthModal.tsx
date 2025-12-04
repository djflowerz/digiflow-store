
import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/store';
import { Modal, Button } from './UI';
import { Mail, Lock, User, Phone, AlertCircle, ArrowLeft, KeyRound, CheckCircle, Smartphone, RefreshCcw, Clock } from 'lucide-react';

const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, signIn, signInWithPhone, signUp, verifyOtp, resendOtp, resetPassword } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'verify' | 'forgot'>('signin');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Resend Timer
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const resetForm = () => {
    setError('');
    setInfo('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setOtp('');
    setReferralCode('');
    setLoading(false);
    setResendCooldown(0);
  };

  const handleClose = () => {
    resetForm();
    setMode('signin');
    setLoginMethod('email');
    closeAuthModal();
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setError('');
    setInfo('');
    setLoading(true);

    try {
        // Handle special case for Password Reset resend
        if (info.toLowerCase().includes('password') || mode === 'forgot') {
            const res = await resetPassword(email);
            if (res.error) {
                setError(res.error);
            } else {
                setInfo(`Password reset link sent again to ${email}.`);
                setResendCooldown(60);
            }
            setLoading(false);
            return;
        }

        const type = loginMethod === 'phone' ? 'sms' : 'signup';
        const identifier = loginMethod === 'phone' ? phone : email;
        
        const res = await resendOtp(identifier, type);
        
        if (res.error) {
            setError(res.error);
        } else {
            setInfo(res.message || "Code regenerated and sent successfully.");
            setResendCooldown(60); // 60 seconds cooldown
        }
    } catch (e: any) {
        setError(e.message);
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        if (loginMethod === 'email') {
            const res = await signIn(email, password);
            if (res.error) setError(res.error);
            else handleClose();
        } else {
            // Phone Sign In
            const res = await signInWithPhone(phone);
            if (res.error) {
                setError(res.error);
            } else if (res.needVerification) {
                setMode('verify');
                setInfo(`Verification code sent to ${phone}.`);
                setResendCooldown(60);
            }
        }
      } 
      else if (mode === 'signup') {
        if (!fullName || !phone) {
          setError("All fields are required");
          setLoading(false);
          return;
        }
        const res = await signUp(email, password, fullName, phone, referralCode);
        if (res.error) {
          setError(res.error);
        } else if (res.needVerification) {
          setMode('verify');
          setInfo(`Verification sent to ${email}.`);
          setResendCooldown(60);
        } else {
          handleClose();
        }
      } 
      else if (mode === 'verify') {
          // Determine type based on previous actions
          let type: 'signup' | 'recovery' | 'email' | 'sms' = 'signup';
          if (info.includes('password')) type = 'recovery';
          else if (loginMethod === 'phone' && mode === 'verify') type = 'sms';

          const identifier = loginMethod === 'phone' ? phone : email;

          const res = await verifyOtp(identifier, otp, type);
          if (res.error) {
              setError(res.error);
          } else {
              // Verification Successful
              setSuccess("Account verified successfully!");
              setTimeout(() => {
                  handleClose();
              }, 1000);
          }
      }
      else if (mode === 'forgot') {
          const res = await resetPassword(email);
          if (res.error) {
              setError(res.error);
          } else {
              setMode('verify');
              setInfo(`Password reset link sent to ${email}.`);
              setResendCooldown(60);
          }
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
      switch(mode) {
          case 'signin': return loginMethod === 'email' ? 'Welcome Back' : 'Mobile Login';
          case 'signup': return 'Create Account';
          case 'verify': return 'Verify Account';
          case 'forgot': return 'Reset Password';
          default: return 'Auth';
      }
  };

  return (
    <Modal isOpen={isAuthModalOpen} onClose={handleClose} title={getTitle()} size="sm">
      {/* Tabs / Header */}
      {mode === 'verify' ? (
          <div className="text-center text-sm text-gray-500 mb-6">
              Complete verification to continue
          </div>
      ) : mode === 'forgot' ? (
          <div className="flex items-center mb-6">
              <button onClick={() => setMode('signin')} className="text-gray-500 hover:text-gray-900 mr-2">
                  <ArrowLeft size={18} />
              </button>
              <span className="text-sm text-gray-500">Enter email to receive reset link</span>
          </div>
      ) : (
        <div className="flex justify-center mb-6 border-b dark:border-gray-700">
            <button 
            className={`pb-2 px-4 font-medium transition-colors ${mode === 'signin' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400'}`}
            onClick={() => { setMode('signin'); setError(''); setInfo(''); setSuccess(''); }}
            >
            Sign In
            </button>
            <button 
            className={`pb-2 px-4 font-medium transition-colors ${mode === 'signup' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400'}`}
            onClick={() => { setMode('signup'); setLoginMethod('email'); setError(''); setInfo(''); setSuccess(''); }}
            >
            Sign Up
            </button>
        </div>
      )}
      
      {/* Login Method Toggle (Only for Sign In) */}
      {mode === 'signin' && (
          <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <button 
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-md transition-all ${loginMethod === 'email' ? 'bg-white dark:bg-gray-600 shadow text-primary-600 font-bold' : 'text-gray-500'}`}
                onClick={() => setLoginMethod('email')}
              >
                  <Mail size={16} /> Email
              </button>
              <button 
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-md transition-all ${loginMethod === 'phone' ? 'bg-white dark:bg-gray-600 shadow text-primary-600 font-bold' : 'text-gray-500'}`}
                onClick={() => setLoginMethod('phone')}
              >
                  <Smartphone size={16} /> Phone
              </button>
          </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex flex-col gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
             <AlertCircle size={16} className="shrink-0" /> 
             <span>{error}</span>
          </div>
          {(error.includes("not found") || error.includes("does not exist")) && mode === 'signin' && (
              <Button size="sm" onClick={() => setMode('signup')} className="self-end mt-1">
                  Switch to Sign Up
              </Button>
          )}
        </div>
      )}

      {info && (
        <div className="bg-blue-50 text-blue-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={16} /> {info}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2 animate-in fade-in">
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {mode === 'verify' && loginMethod === 'email' && !info.includes('password') && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg text-sm mb-6">
          <h4 className="font-bold flex items-center gap-2 mb-2"><Mail size={16}/> Check your Inbox</h4>
          <p className="mb-2">We sent a confirmation <strong>link</strong> to {email}.</p>
          <ul className="list-disc pl-4 space-y-1 text-xs opacity-90">
             <li><strong>Click the link</strong> in the email to activate your account.</li>
             <li>Check your <strong>Spam</strong> folder if you don't see it.</li>
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Full Name" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                required={mode === 'signup'}
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="tel" 
                placeholder="Phone (e.g., 2547...)" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                required={mode === 'signup'}
              />
            </div>
            {/* Referral Code */}
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
               <input 
                type="text" 
                placeholder="Referral Code (Optional)" 
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="w-full pl-10 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </>
        )}

        {(mode === 'signin' || mode === 'signup' || mode === 'forgot') && loginMethod === 'email' && (
            <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
                type="email" 
                placeholder="Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                required
            />
            </div>
        )}

        {mode === 'signin' && loginMethod === 'phone' && (
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="tel" 
                placeholder="Phone Number (e.g. 2547...)" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
        )}
        
        {((mode === 'signin' && loginMethod === 'email') || mode === 'signup') && (
            <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                required
            />
            </div>
        )}

        {mode === 'verify' && (loginMethod === 'phone' || info.includes('password') || mode === 'verify') && (
             <div className="relative">
             <KeyRound className="absolute left-3 top-3 text-gray-400" size={18} />
             <input 
                 type="text" 
                 placeholder="Enter 6-digit code" 
                 value={otp}
                 onChange={(e) => setOtp(e.target.value)}
                 className="w-full pl-10 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 tracking-widest text-center font-bold"
                 maxLength={6}
             />
             </div>
        )}

        {mode === 'signin' && loginMethod === 'email' && (
            <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={() => setMode('forgot')} 
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                    Forgot Password?
                </button>
            </div>
        )}

        {/* Buttons */}
        {mode === 'verify' ? (
          <div className="flex flex-col gap-4">
             {loginMethod === 'email' && !info.includes('password') && (
                 <Button type="button" onClick={() => setMode('signin')} variant="outline" className="w-full">
                   I verified! Go to Login
                 </Button>
             )}
             
             {(loginMethod === 'phone' || info.includes('password')) && (
                 <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                   Verify & Login
                 </Button>
             )}

             {/* Resend Timer / Button */}
             <div className="flex flex-col items-center mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {resendCooldown > 0 ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock size={16} className="text-primary-600" />
                        <span>Regenerate code in <span className="font-bold text-primary-600">{resendCooldown}s</span></span>
                    </div>
                ) : (
                    <button 
                        type="button" 
                        onClick={handleResend}
                        disabled={loading}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-2 transition-transform hover:scale-105"
                    >
                        <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
                        Resend Verification Code
                    </button>
                )}
             </div>
          </div>
        ) : (
          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            {mode === 'signin' ? (loginMethod === 'email' ? 'Sign In' : 'Send OTP') : 
             mode === 'signup' ? 'Create Account' : 
             mode === 'forgot' ? 'Send Reset Link' : 'Submit'}
          </Button>
        )}
      </form>
    </Modal>
  );
};

export default AuthModal;
