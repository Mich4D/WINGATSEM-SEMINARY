import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const BootstrapAdmin: React.FC = () => {
  const { user, profile } = useAuth();
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessage('You must be logged in first.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/set-admin-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          uid: user.id, 
          secret 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Success! You are now an admin. Please log out and log back in to refresh your permissions.');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setMessage(`Error: ${data.error || 'Failed to set admin claim'}`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Bootstrap Admin</h2>
          <p className="text-slate-600 mb-6">You need to be logged in to make yourself an admin.</p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Bootstrap Admin</h2>
        <p className="text-slate-600 mb-6 text-sm">
          Enter your <code className="bg-slate-100 px-1 rounded">ADMIN_BOOTSTRAP_SECRET</code> to promote your account ({user.email}) to an Administrator.
        </p>

        {profile?.role === 'admin' && (
          <div className="mb-6 p-3 bg-green-50 text-green-700 text-sm rounded border border-green-200">
            You are already an admin!
          </div>
        )}

        <form onSubmit={handleBootstrap} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Bootstrap Secret
            </label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
              placeholder="Enter secret..."
              required
            />
          </div>

          {message && (
            <div className={`p-3 rounded text-sm ${message.startsWith('Success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !secret}
            className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Make Me Admin'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BootstrapAdmin;
