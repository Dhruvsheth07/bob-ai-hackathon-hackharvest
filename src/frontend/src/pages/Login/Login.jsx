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

      {/* Right side - Image/Graphic */}
      <div className="hidden lg:block relative flex-1 bg-surface-container-lowest">
        <div className="absolute inset-0 w-full h-full object-cover">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
          <img
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            src="https://images.unsplash.com/photo-1586528116311-ad8ed3c84a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80"
            alt="Port terminal at night"
          />
        </div>
        <div className="absolute bottom-12 left-12 right-12 z-20">
          <h3 className="text-2xl font-semibold text-white mb-2">
            Intelligent Maritime Logistics
          </h3>
          <p className="text-lg text-white/80 max-w-xl">
            Real-time telemetry, AI-driven congestion prediction, and optimization for the world's busiest container terminals.
          </p>
        </div>
      </div>
    </div>
  );
}
