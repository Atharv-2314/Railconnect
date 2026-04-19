import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Train, User, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleRoleClick = (clickedPortal) => {
    if (user) {
      // An admin clicking "Traveler Login" (PASSENGER portal) goes to /home
      // An admin clicking "Staff Portal" (ADMIN portal) goes to /admin/dashboard
      // A passenger can only access /home
      if (clickedPortal === 'ADMIN') {
        if (user.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else {
          alert("Access Denied: 🛡️ Only Administrators can access this console.");
        }
      } else {
        navigate('/home');
      }
    } else {
      navigate(`/login?role=${clickedPortal}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

      <div className="z-10 text-center mb-16 animate-fade-in-up">
        <Train className="h-24 w-24 text-teal-500 mx-auto mb-6" />
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 mb-6 tracking-tight">
          Welcome to RailConnect
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          The next generation railway reservation platform. Fast, secure, and purely database constrained.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl z-10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        
        {/* Passenger Login */}
        <button 
          onClick={() => handleRoleClick('PASSENGER')}
          className="glass-panel p-8 flex flex-col items-center text-center hover:border-teal-500/50 hover:bg-teal-500/5 transition-all group"
        >
          <div className="h-16 w-16 bg-teal-500/20 rounded-full flex items-center justify-center mb-6 group-hover:bg-teal-500/30 transition-colors">
            <User className="h-8 w-8 text-teal-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Traveler Login</h2>
          <p className="text-gray-400 text-sm">Book tickets, manage upcoming trips, and view your carbon points.</p>
        </button>

        {/* Join Portal */}
        <button 
          onClick={() => navigate('/register')}
          className="glass-panel p-8 flex flex-col items-center text-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">NEW</div>
          <div className="h-16 w-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-500/30 transition-colors">
            <UserPlus className="h-8 w-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Join RailConnect</h2>
          <p className="text-gray-400 text-sm">Create a completely free account instantly and start exploring the Indian Railway lines.</p>
        </button>

        {/* Admin Login */}
        <button 
          onClick={() => handleRoleClick('ADMIN')}
          className="glass-panel p-8 flex flex-col items-center text-center hover:border-red-500/50 hover:bg-red-500/5 transition-all group"
        >
          <div className="h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6 group-hover:bg-red-500/30 transition-colors">
            <ShieldCheck className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Staff Portal</h2>
          <p className="text-gray-400 text-sm">Strict Admin access required. Manage train routes, execute schedules, and monitor systems.</p>
        </button>

      </div>
    </div>
  );
};

export default LandingPage;
