import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn, KeyRound, User } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Determine which portal was clicked on the landing page
  const intendedPortal = searchParams.get('role'); // 'ADMIN' | 'PASSENGER' | null

  const getRedirectPath = (userRole) => {
    // If admin logs in through the Staff Portal link, go to admin dashboard
    if (userRole === 'ADMIN' && intendedPortal === 'ADMIN') {
      return '/admin/dashboard';
    }
    // Otherwise (admin via Traveler Login, or any passenger) go to /home
    return '/home';
  };

  useEffect(() => {
    if (user) {
      navigate(getRedirectPath(user.role));
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = await login(username, password);
      navigate(getRedirectPath(userData.role));
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="glass-panel p-8 w-full max-w-md animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-teal-500/20 rounded-full flex items-center justify-center mb-4">
            <LogIn className="h-8 w-8 text-teal-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-400">Sign in to your RailConnect account</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field pl-10"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3 text-lg mt-4">
            Login
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Don't have an account? <a href="/register" className="text-teal-400 hover:text-teal-300 transition-colors">Sign up here</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
