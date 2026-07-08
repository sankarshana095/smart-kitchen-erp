import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate('/');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-900 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white/10 p-8 shadow-2xl backdrop-blur-md border border-white/10">
        <div>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-white">
            Create an Account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-300">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-teal-400 hover:text-teal-350 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-300 animate-pulse">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                className="block w-full rounded-lg border-0 bg-white/5 py-2.5 px-4 text-white placeholder-slate-400 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-teal-400 sm:text-sm"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email address</label>
              <input
                type="email"
                required
                className="block w-full rounded-lg border-0 bg-white/5 py-2.5 px-4 text-white placeholder-slate-400 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-teal-400 sm:text-sm"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Desired Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="block w-full rounded-lg border-0 bg-slate-800 py-2.5 px-4 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-teal-400 sm:text-sm"
              >
                <option value="VIEWER">Viewer (Read-only)</option>
                <option value="KITCHEN_STAFF">Kitchen Staff</option>
                <option value="STORE_MANAGER">Store Manager</option>
                <option value="ADMIN">Administrator</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Note: The first registered user in the database automatically becomes the ADMIN.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                className="block w-full rounded-lg border-0 bg-white/5 py-2.5 px-4 text-white placeholder-slate-400 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-teal-400 sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                className="block w-full rounded-lg border-0 bg-white/5 py-2.5 px-4 text-white placeholder-slate-400 ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-teal-400 sm:text-sm"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-teal-500 hover:bg-teal-450 py-3 px-4 text-sm font-semibold text-slate-950 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-teal-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
