import { motion } from 'framer-motion';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Divider, FloralBranch } from '@/components/Ornaments';
import { api, ApiError } from '@/lib/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api('/api/admin/login', { method: 'POST', body: { email, password } });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="paper-texture relative grid min-h-dscreen place-items-center overflow-hidden bg-ivory px-5">
      <FloralBranch className="pointer-events-none absolute -left-10 -top-6 w-52 rotate-180 opacity-60" />
      <FloralBranch className="pointer-events-none absolute -bottom-6 -right-10 w-52 opacity-60" />
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card relative w-full max-w-sm p-7 sm:p-9"
      >
        <p className="eyebrow text-center">Panel de los novios</p>
        <h1 className="mt-3 text-center font-serif text-4xl">Bienvenidos</h1>
        <Divider className="my-6" />
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        <label className="label mt-4" htmlFor="password">Contraseña</label>
        <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </motion.form>
    </main>
  );
}
