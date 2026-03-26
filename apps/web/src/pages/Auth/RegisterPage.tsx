import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  }

  const features = [
    '💪 Antrenman takibi ve kişisel rekordlar',
    '🥗 1M+ gıdalı beslenme veritabanı',
    '📈 İlerleme grafikleri ve analizler',
    '📋 Uzman hazırlı program planları',
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#080C14' }}>

      {/* Left: features */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-14">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 40% 40%, rgba(249,115,22,0.1) 0%, transparent 60%)' }} />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 60% 70%, rgba(168,85,247,0.07) 0%, transparent 60%)' }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="relative z-10 w-full max-w-xs">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #f97316, #e11d48)', boxShadow: '0 8px 32px rgba(249,115,22,0.4)' }}>
              ⚡
            </div>
            <span className="font-bold text-xl text-white">FitTrack</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Her şey dahil.</h2>
          <p className="text-gray-400 mb-8">Fitness yolculuğunuzu tek bir yerde yönetin.</p>

          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 py-3 px-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute inset-0 lg:hidden"
          style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(249,115,22,0.06) 0%, transparent 60%)' }} />

        <div className="w-full max-w-sm relative z-10">
          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-6 lg:hidden">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                style={{ background: 'linear-gradient(135deg, #f97316, #e11d48)' }}>⚡</div>
              <span className="font-bold text-white">FitTrack</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Hesap oluşturun</h2>
            <p className="text-gray-500 mt-1 text-sm">Ücretsiz, kredi kartı gerekmez</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm text-red-400"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Ad Soyad</label>
              <input type="text" className="input" placeholder="Adınız Soyadınız"
                value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            </div>
            <div>
              <label className="label">E-posta</label>
              <input type="email" className="input" placeholder="ornek@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <label className="label">Şifre</label>
              <input type="password" className="input" placeholder="En az 8 karakter"
                value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Hesap oluşturuluyor...
                </span>
              ) : 'Kayıt Ol — Ücretsiz'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-gray-600">
            Kayıt olarak{' '}
            <span className="text-gray-500">Kullanım Şartları</span>
            {' '}ve{' '}
            <span className="text-gray-500">Gizlilik Politikası</span>'nı kabul etmiş olursunuz.
          </p>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-xs text-gray-600">veya</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <p className="text-center text-sm text-gray-500">
            Zaten hesabınız var mı?{' '}
            <Link to="/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
              Giriş yapın
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
