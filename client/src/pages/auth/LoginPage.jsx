import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { validateLogin, hasErrors } from '../../utils/validators';
import { Compass } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validateLogin(formData);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await signIn(formData.email, formData.password);
      toast.success('Logged in successfully');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/3 h-80 w-80 rounded-full bg-purple-600/15 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/3 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="relative w-full max-w-md space-y-8 rounded-xl border border-slate-800 bg-slate-900/70 p-8 backdrop-blur-sm">
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <Compass className="h-6 w-6" />
            Course Compass
          </Link>
          <h1
            className="mt-6 text-2xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-400">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="••••••••"
          />

          <Button type="submit" loading={loading} className="w-full">
            Sign In
          </Button>
        </form>

        <div className="space-y-2 text-center text-sm">
          <Link to="/forgot-password" className="text-purple-400 hover:text-purple-300 transition-colors">
            Forgot your password?
          </Link>
          <p className="text-gray-400">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-purple-400 hover:text-purple-300 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
