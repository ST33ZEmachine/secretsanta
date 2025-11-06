import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import PixelGift from '../components/PixelGift';
import PixelIcon from '../components/PixelIcon';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError('');

    try {
      await login(data.email, data.password);
      // Redirect to returnUrl if provided, otherwise to dashboard
      const returnUrl = searchParams.get('returnUrl');
      navigate(returnUrl || '/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-4">
            <PixelGift size={64} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-2">
            <PixelIcon name="star" size={24} color="#ffd700" />
            Sign in to Secret Santa
            <PixelIcon name="star" size={24} color="#ffd700" />
          </h2>
          <p className="mt-3 text-center text-sm text-gray-600 flex items-center justify-center gap-2">
            <PixelIcon name="snowflake" size={12} color="#16a34a" />
            Or{' '}
            <Link
              to="/register"
              className="font-bold text-primary-600 hover:text-primary-700 underline"
            >
              create a new account
            </Link>
            {' '}
            <PixelIcon name="snowflake" size={12} color="#dc2626" />
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6 card">
          {error && (
            <div className="bg-red-50 border-2 border-red-800 p-4" style={{ boxShadow: '4px 4px 0px 0px rgb(127 29 29)' }}>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  type="email"
                  className="input-field pl-10"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password', {
                    required: 'Password is required',
                  })}
                  type="password"
                  className="input-field pl-10"
                  placeholder="Enter your password"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
