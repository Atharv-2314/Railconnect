import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { UserPlus, User, KeyRound, Phone, UserCircle2 } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '', password: '', name: '', age: '', gender: 'M', phone: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', formData);
      navigate('/login');
    } catch (err) {
      setError('Registration failed. Username may be taken.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="glass-panel p-8 w-full max-w-lg animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-teal-500/20 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-8 w-8 text-teal-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-400">Join RailConnect today.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="input-field pl-10" placeholder="Username" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-500" />
                </div>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="input-field pl-10" placeholder="Password" />
              </div>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCircle2 className="h-5 w-5 text-gray-500" />
                </div>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field pl-10" placeholder="John Doe" />
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Age</label>
              <input required type="number" min="1" max="120" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="input-field" placeholder="Age" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
              <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="input-field">
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-500" />
                </div>
                <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-field pl-10" placeholder="1234567890" />
              </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3 text-lg mt-6">
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
