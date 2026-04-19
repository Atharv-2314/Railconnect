import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Train, UserCircle, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 group">
              <Train className="h-8 w-8 text-teal-500 group-hover:text-teal-400 transition-colors" />
              <span className="font-bold text-xl tracking-tight text-white group-hover:text-teal-500 transition-colors">
                RailConnect
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-6">
            {!user ? (
              <>
                <Link to="/login" className="text-gray-300 hover:text-white font-medium transition-colors">Login</Link>
                <Link to="/register" className="btn-primary py-1.5 text-sm">Sign Up</Link>
              </>
            ) : (
              <>
                <Link to="/profile" className="flex items-center gap-2 text-gray-300 hover:text-teal-400 transition-colors group">
                    <div className="h-8 w-8 rounded-full bg-teal-500/20 group-hover:bg-teal-500/30 transition-colors flex items-center justify-center">
                        <UserCircle className="h-5 w-5 text-teal-400" />
                    </div>
                    <span className="font-medium text-sm">{user.username}</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
