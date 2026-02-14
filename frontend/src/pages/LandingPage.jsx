import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Sword, Castle, Mountain, Fish, TreePine } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { login, register, isLoading, error, clearError } = useGameStore();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    try {
      if (isLogin) {
        const result = await login(formData.username, formData.password);
        if (result.has_character) {
          navigate('/game');
        } else {
          navigate('/create-character');
        }
      } else {
        await register(formData.username, formData.password, formData.email);
        navigate('/create-character');
      }
    } catch (err) {
      console.error('Auth error:', err);
    }
  };

  const features = [
    { icon: Sword, title: 'Epic Combat', desc: 'Battle monsters and bosses' },
    { icon: Mountain, title: 'Skill Training', desc: 'Level up 10+ unique skills' },
    { icon: Fish, title: 'Gathering', desc: 'Fish, mine, and woodcut' },
    { icon: TreePine, title: 'Open World', desc: 'Explore multiple zones' },
  ];

  return (
    <div className="min-h-screen w-full relative overflow-hidden" data-testid="landing-page">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c0a09] via-[#1c1917] to-[#0c0a09]" />
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1920')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Castle className="w-10 h-10 text-[#fbbf24]" />
            <h1 className="font-cinzel text-2xl font-bold tracking-wider text-[#fbbf24]">
              Quest Of Honor
            </h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-6xl grid md:grid-cols-2 gap-12 items-center">
            {/* Left - Hero Section */}
            <div className="text-left space-y-6">
              <h2 className="font-cinzel text-4xl md:text-5xl lg:text-6xl font-bold text-[#f5f5f4] leading-tight">
                Forge Your
                <span className="block text-[#fbbf24]">Legend</span>
              </h2>
              <p className="text-[#a8a29e] text-base md:text-lg max-w-md">
                Enter a medieval fantasy world of adventure. Train skills, battle monsters, 
                complete quests, and become a legend in this browser-based MMORPG.
              </p>
              
              {/* Features */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                {features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#1c1917]/60 border border-[#44403c] rounded">
                    <feat.icon className="w-6 h-6 text-[#fbbf24] flex-shrink-0" />
                    <div>
                      <p className="font-rajdhani font-semibold text-[#f5f5f4]">{feat.title}</p>
                      <p className="text-xs text-[#78716c]">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Auth Form */}
            <div className="w-full max-w-md mx-auto">
              <div className="game-panel p-6" data-testid="auth-panel">
                <div className="game-panel-header -mx-6 -mt-6 mb-6 text-center">
                  {isLogin ? 'Login' : 'Create Account'}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-[#a8a29e] font-rajdhani">Username</Label>
                    <Input
                      id="username"
                      data-testid="username-input"
                      className="input-medieval w-full"
                      placeholder="Enter username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[#a8a29e] font-rajdhani">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        data-testid="email-input"
                        className="input-medieval w-full"
                        placeholder="Enter email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[#a8a29e] font-rajdhani">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      data-testid="password-input"
                      className="input-medieval w-full"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>

                  {error && (
                    <p className="text-[#dc2626] text-sm font-rajdhani" data-testid="auth-error">{error}</p>
                  )}

                  <Button
                    type="submit"
                    data-testid="auth-submit-btn"
                    className="btn-medieval btn-medieval-primary w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Please wait...' : isLogin ? 'Enter World' : 'Begin Journey'}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    data-testid="toggle-auth-mode"
                    className="text-[#a8a29e] hover:text-[#fbbf24] transition-colors text-sm"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      clearError();
                    }}
                  >
                    {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 text-center text-[#78716c] text-sm">
          <p className="font-rajdhani">Quest Of Honor - A Browser MMORPG Experience</p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
