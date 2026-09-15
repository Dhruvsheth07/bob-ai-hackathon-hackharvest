import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/common/Input';
import Button from '../../components/common/Button';

export function Login() {
  const [email, setEmail] = useState('admin@port.local');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24 border-r border-outline-variant bg-surface">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex items-center gap-2 mb-8">
            <Anchor className="w-8 h-8 text-primary" />
            <span className="font-sans font-bold text-2xl tracking-tight text-primary">PORT OPTIMIZER</span>
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-on-surface mb-2">
            Welcome back
          </h2>
          <p className="text-sm text-on-surface-variant mb-8">
            Sign in to access the operational dashboard and tools.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                Email address
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="h-10"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-on-surface">
                  Password
                </label>
                <a href="#" className="text-sm font-medium text-primary hover:text-primary-container transition-colors">
                  Forgot password?
                </a>
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-10"
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-outline-variant bg-surface-container text-primary focus:ring-primary focus:ring-offset-background"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-on-surface-variant">
                Remember me for 30 days
              </label>
            </div>

            {error && (
              <div className="bg-error-container text-on-error-container p-3 rounded-md text-sm border border-error/50">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 text-base"
              isLoading={isLoading}
            >
              Sign in
            </Button>
          </form>
        </div>
      </div>

      {/* Right side — CSS port illustration, no external image needed */}
      <div className="hidden lg:flex relative flex-1 flex-col items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0a0f1e 0%, #0d1b3e 40%, #0a2a4a 70%, #071e36 100%)',
        }}
      >
        {/* Animated star field */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(60)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 2 + 1 + 'px',
                height: Math.random() * 2 + 1 + 'px',
                top: Math.random() * 60 + '%',
                left: Math.random() * 100 + '%',
                opacity: Math.random() * 0.6 + 0.2,
                animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
                animationDelay: Math.random() * 3 + 's',
              }}
            />
          ))}
        </div>

        {/* Water reflection gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,80,160,0.25), transparent)' }}
        />

        {/* Port SVG Illustration */}
        <div className="relative z-10 w-full max-w-md px-8 flex flex-col items-center">
          <svg viewBox="0 0 420 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-2xl">
            {/* Water */}
            <rect x="0" y="200" width="420" height="60" rx="4" fill="#0a2a4a" opacity="0.8"/>
            <path d="M0 210 Q50 205 100 210 Q150 215 200 210 Q250 205 300 210 Q350 215 420 210" stroke="#1e4976" strokeWidth="2" fill="none" opacity="0.6"/>
            <path d="M0 220 Q70 215 140 220 Q210 225 280 220 Q350 215 420 220" stroke="#1e4976" strokeWidth="1.5" fill="none" opacity="0.4"/>

            {/* Dock / Pier */}
            <rect x="20" y="185" width="380" height="18" rx="3" fill="#1a2744"/>
            <rect x="20" y="198" width="380" height="6" rx="2" fill="#243055"/>

            {/* Crane 1 */}
            <rect x="60" y="80" width="8" height="120" fill="#1e4070"/>
            <rect x="60" y="80" width="100" height="8" fill="#2a5fa0" rx="2"/>
            <line x1="64" y1="80" x2="160" y2="88" stroke="#3a6fb0" strokeWidth="2"/>
            <line x1="160" y1="88" x2="120" y2="185" stroke="#2a5fa0" strokeWidth="2"/>
            <rect x="108" y="130" width="4" height="55" stroke="#4d9de0" strokeWidth="1.5" fill="none"/>
            <rect x="103" y="182" width="14" height="10" rx="1" fill="#4d9de0" opacity="0.8"/>

            {/* Crane 2 */}
            <rect x="220" y="60" width="8" height="140" fill="#1e4070"/>
            <rect x="220" y="60" width="120" height="8" fill="#2a5fa0" rx="2"/>
            <line x1="224" y1="60" x2="340" y2="68" stroke="#3a6fb0" strokeWidth="2"/>
            <line x1="340" y1="68" x2="290" y2="185" stroke="#2a5fa0" strokeWidth="2"/>
            <rect x="278" y="110" width="4" height="75" stroke="#4d9de0" strokeWidth="1.5" fill="none"/>
            <rect x="273" y="182" width="14" height="10" rx="1" fill="#4d9de0" opacity="0.8"/>

            {/* Ship hull */}
            <path d="M90 175 L90 145 L310 145 L330 175 Z" fill="#112244" stroke="#1e3a6a" strokeWidth="1.5"/>
            <rect x="130" y="120" width="140" height="28" rx="3" fill="#1a3260" stroke="#2a4a80" strokeWidth="1"/>
            <rect x="160" y="105" width="80" height="18" rx="2" fill="#1e3c70" stroke="#2a4a80" strokeWidth="1"/>
            {/* Portholes */}
            <circle cx="150" cy="134" r="5" fill="#0d2040" stroke="#3a6fb0" strokeWidth="1.5"/>
            <circle cx="175" cy="134" r="5" fill="#0d2040" stroke="#3a6fb0" strokeWidth="1.5"/>
            <circle cx="200" cy="134" r="5" fill="#0d2040" stroke="#3a6fb0" strokeWidth="1.5"/>
            <circle cx="225" cy="134" r="5" fill="#0d2040" stroke="#3a6fb0" strokeWidth="1.5"/>
            <circle cx="250" cy="134" r="5" fill="#0d2040" stroke="#3a6fb0" strokeWidth="1.5"/>
            {/* Ship lights */}
            <circle cx="200" cy="100" r="3" fill="#f0c040" opacity="0.9"/>

            {/* Containers on dock */}
            <rect x="30" y="167" width="30" height="20" rx="2" fill="#c0392b" opacity="0.85"/>
            <rect x="64" y="167" width="30" height="20" rx="2" fill="#2980b9" opacity="0.85"/>
            <rect x="98" y="167" width="30" height="20" rx="2" fill="#27ae60" opacity="0.85"/>
            <rect x="330" y="167" width="30" height="20" rx="2" fill="#8e44ad" opacity="0.85"/>
            <rect x="364" y="167" width="30" height="20" rx="2" fill="#e67e22" opacity="0.85"/>

            {/* Horizon glow */}
            <ellipse cx="210" cy="195" rx="180" ry="8" fill="#2a6fa8" opacity="0.15"/>

            {/* Blinking nav lights */}
            <circle cx="90" cy="142" r="3" fill="#e74c3c" opacity="0.9"/>
            <circle cx="330" cy="142" r="3" fill="#2ecc71" opacity="0.9"/>
          </svg>

          {/* Stats bar */}
          <div className="mt-6 w-full grid grid-cols-3 gap-3">
            {[
              { label: 'Berths Active', value: '12/15' },
              { label: 'Vessels Today', value: '47' },
              { label: 'On-Time Rate', value: '94%' },
            ].map((stat) => (
              <div key={stat.label}
                className="rounded-xl px-3 py-3 text-center border"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
              >
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom text */}
        <div className="absolute bottom-10 left-10 right-10 z-20 text-center">
          <h3 className="text-2xl font-semibold text-white mb-2">
            Intelligent Maritime Logistics
          </h3>
          <p className="text-sm max-w-sm mx-auto" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Real-time telemetry, AI-driven congestion prediction, and optimization for the world's busiest container terminals.
          </p>
        </div>
      </div>
    </div>
  );
}
