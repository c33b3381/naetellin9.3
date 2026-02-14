import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Sword, Sparkles, Target, Shield, User, Castle } from 'lucide-react';

const HAIR_COLORS = [
  { id: 'brown', color: '#8B4513', name: 'Brown' },
  { id: 'black', color: '#1a1a1a', name: 'Black' },
  { id: 'blonde', color: '#F4D03F', name: 'Blonde' },
  { id: 'red', color: '#B7410E', name: 'Red' },
  { id: 'gray', color: '#808080', name: 'Gray' },
  { id: 'white', color: '#E8E8E8', name: 'White' },
];

const SKIN_TONES = [
  { id: 'light', color: '#FFDFC4', name: 'Light' },
  { id: 'medium', color: '#D2B48C', name: 'Medium' },
  { id: 'tan', color: '#C68642', name: 'Tan' },
  { id: 'brown', color: '#8D5524', name: 'Brown' },
  { id: 'dark', color: '#5C4033', name: 'Dark' },
];

const CLASSES = [
  { id: 'warrior', name: 'Warrior', icon: Sword, desc: 'Masters of melee combat', color: '#dc2626' },
  { id: 'mage', name: 'Mage', icon: Sparkles, desc: 'Wielders of arcane magic', color: '#3b82f6' },
  { id: 'ranger', name: 'Ranger', icon: Target, desc: 'Swift and deadly archers', color: '#059669' },
  { id: 'paladin', name: 'Paladin', icon: Shield, desc: 'Holy defenders of light', color: '#fbbf24' },
];

const CharacterCreation = () => {
  const navigate = useNavigate();
  const { createCharacter, isLoading, error, username } = useGameStore();
  const [character, setCharacter] = useState({
    name: '',
    gender: 'male',
    hair_color: '#8B4513',
    skin_tone: '#D2B48C',
    class_type: 'warrior'
  });

  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!character.name || isLoading) {
      console.log('Submit blocked:', { name: character.name, isLoading });
      return;
    }
    
    console.log('Creating character:', character);
    try {
      await createCharacter(character);
      console.log('Character created, navigating to game...');
      navigate('/game');
    } catch (err) {
      console.error('Character creation failed:', err);
      alert('Character creation failed: ' + (err.response?.data?.detail || err.message || 'Unknown error'));
    }
  }, [character, isLoading, createCharacter, navigate]);

  // Listen for Enter key to submit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && character.name && !isLoading) {
        handleSubmit();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [character.name, isLoading, handleSubmit]);

  const selectedClass = CLASSES.find(c => c.id === character.class_type);

  return (
    <div className="min-h-screen w-full bg-[#0c0a09] relative overflow-hidden" data-testid="character-creation-page">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #fbbf24 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 flex items-center gap-3">
          <Castle className="w-8 h-8 text-[#fbbf24]" />
          <h1 className="font-cinzel text-xl font-bold tracking-wider text-[#fbbf24]">Quest Of Honor</h1>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-4xl">
            <div className="game-panel p-6">
              <div className="game-panel-header -mx-6 -mt-6 mb-6 text-center">
                Create Your Hero
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Character Name */}
                <div className="space-y-2">
                  <Label className="text-[#a8a29e] font-rajdhani text-sm">Character Name</Label>
                  <Input
                    data-testid="character-name-input"
                    className="input-medieval w-full max-w-xs"
                    placeholder="Enter character name"
                    value={character.name}
                    onChange={(e) => setCharacter({ ...character, name: e.target.value })}
                    maxLength={16}
                    required
                  />
                </div>

                {/* Gender Selection */}
                <div className="space-y-3">
                  <Label className="text-[#a8a29e] font-rajdhani text-sm">Gender</Label>
                  <div className="flex gap-4">
                    {[
                      { id: 'male', label: 'Male' },
                      { id: 'female', label: 'Female' }
                    ].map(g => (
                      <button
                        key={g.id}
                        type="button"
                        data-testid={`gender-${g.id}`}
                        className={`flex items-center gap-2 px-6 py-3 border-2 rounded transition-all ${
                          character.gender === g.id
                            ? 'border-[#fbbf24] bg-[#fbbf24]/10 text-[#fbbf24]'
                            : 'border-[#44403c] hover:border-[#57534e] text-[#a8a29e]'
                        }`}
                        onClick={() => setCharacter({ ...character, gender: g.id })}
                      >
                        <User className="w-6 h-6" />
                        <span className="font-rajdhani font-semibold">{g.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Class Selection */}
                <div className="space-y-3">
                  <Label className="text-[#a8a29e] font-rajdhani text-sm">Class</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {CLASSES.map(cls => (
                      <button
                        key={cls.id}
                        type="button"
                        data-testid={`class-${cls.id}`}
                        className={`p-4 border-2 rounded text-center transition-all ${
                          character.class_type === cls.id
                            ? 'border-[#fbbf24] bg-[#fbbf24]/10'
                            : 'border-[#44403c] hover:border-[#57534e]'
                        }`}
                        onClick={() => setCharacter({ ...character, class_type: cls.id })}
                      >
                        <cls.icon 
                          className="w-8 h-8 mx-auto mb-2" 
                          style={{ color: character.class_type === cls.id ? cls.color : '#a8a29e' }}
                        />
                        <p className={`font-rajdhani font-semibold ${
                          character.class_type === cls.id ? 'text-[#f5f5f4]' : 'text-[#a8a29e]'
                        }`}>
                          {cls.name}
                        </p>
                        <p className="text-xs text-[#78716c] mt-1">{cls.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Appearance */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Hair Color */}
                  <div className="space-y-3">
                    <Label className="text-[#a8a29e] font-rajdhani text-sm">Hair Color</Label>
                    <div className="flex gap-2 flex-wrap">
                      {HAIR_COLORS.map(h => (
                        <button
                          key={h.id}
                          type="button"
                          data-testid={`hair-${h.id}`}
                          className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${
                            character.hair_color === h.color ? 'border-[#fbbf24] scale-110' : 'border-[#44403c]'
                          }`}
                          style={{ backgroundColor: h.color }}
                          onClick={() => setCharacter({ ...character, hair_color: h.color })}
                          title={h.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Skin Tone */}
                  <div className="space-y-3">
                    <Label className="text-[#a8a29e] font-rajdhani text-sm">Skin Tone</Label>
                    <div className="flex gap-2 flex-wrap">
                      {SKIN_TONES.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          data-testid={`skin-${s.id}`}
                          className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${
                            character.skin_tone === s.color ? 'border-[#fbbf24] scale-110' : 'border-[#44403c]'
                          }`}
                          style={{ backgroundColor: s.color }}
                          onClick={() => setCharacter({ ...character, skin_tone: s.color })}
                          title={s.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="flex items-center gap-6 p-4 bg-[#0c0a09] rounded border border-[#44403c]">
                  <div 
                    className="w-20 h-20 rounded-lg border-2 border-[#44403c] flex items-center justify-center"
                    style={{ backgroundColor: character.skin_tone }}
                  >
                    {selectedClass && (
                      <selectedClass.icon className="w-10 h-10" style={{ color: selectedClass.color }} />
                    )}
                  </div>
                  <div>
                    <p className="font-cinzel text-xl text-[#f5f5f4]">
                      {character.name || 'Unnamed Hero'}
                    </p>
                    <p className="font-rajdhani text-[#a8a29e]">
                      {character.gender === 'male' ? 'Male' : 'Female'} {selectedClass?.name}
                    </p>
                  </div>
                </div>

                {error && (
                  <p className="text-[#dc2626] text-sm font-rajdhani">{error}</p>
                )}

                <div className="flex flex-col md:flex-row items-center gap-4">
                  <Button
                    type="submit"
                    data-testid="create-character-btn"
                    className="btn-medieval btn-medieval-primary w-full md:w-auto px-12"
                    disabled={isLoading || !character.name}
                  >
                    {isLoading ? 'Creating...' : 'Begin Adventure'}
                  </Button>
                  <span className="text-[#78716c] text-sm font-rajdhani">
                    or press <kbd className="px-2 py-1 bg-[#1a1a1a] border border-[#44403c] rounded text-[#fbbf24]">Enter</kbd> to start
                  </span>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CharacterCreation;
