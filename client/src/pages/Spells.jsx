import { useState, useMemo } from 'react';
import { useCharacterStore } from '../store/characterStore';
import SpellDetailsModal from '../components/spells/SpellDetailsModal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Clock, 
  Ruler, 
  Shield, 
  Sparkles, 
  Eye, 
  Heart, 
  Flame, 
  Theater, 
  Skull, 
  FlaskConical, 
  Scroll,
  BookOpen
} from 'lucide-react';

// --- Constants & Helpers ---
const SCHOOL_COLORS = {
  Abjuration: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  Conjuration: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  Divination: 'text-gray-300 border-gray-300/30 bg-gray-300/10',
  Enchantment: 'text-pink-400 border-pink-400/30 bg-pink-400/10',
  Evocation: 'text-red-400 border-red-400/30 bg-red-400/10',
  Illusion: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
  Necromancy: 'text-green-400 border-green-400/30 bg-green-400/10',
  Transmutation: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  Universal: 'text-white border-white/30 bg-white/10',
};

const SCHOOL_ICONS = {
  Abjuration: Shield,
  Conjuration: Sparkles,
  Divination: Eye,
  Enchantment: Heart,
  Evocation: Flame,
  Illusion: Theater,
  Necromancy: Skull,
  Transmutation: FlaskConical,
  Universal: Sparkles,
};

// --- Components ---

function SpellCard({ spell, onClick, isPrepared, onTogglePrepare }) {
  const schoolStyle = SCHOOL_COLORS[spell.school] || SCHOOL_COLORS.Universal;
  const SchoolIcon = SCHOOL_ICONS[spell.school] || SCHOOL_ICONS.Universal;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
      className={`relative group bg-dark-surface rounded-xl border border-dark-border overflow-hidden cursor-pointer transition-all duration-300 ${
        isPrepared ? 'ring-1 ring-gold-primary/50' : ''
      }`}
      onClick={onClick}
    >
      {/* Header / Level Indicator */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-dark-border to-transparent group-hover:from-gold-primary/50 transition-colors" />
      
      <div className="p-4 flex flex-col h-full">
        {/* Top Row: Level & School */}
        <div className="flex justify-between items-start mb-3">
          <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 ${schoolStyle}`}>
            <SchoolIcon className="w-3 h-3" />
            {spell.school}
          </span>
          <span className="text-xs font-bold text-gray-500 bg-dark-bg px-2 py-1 rounded">
            {spell.level === 0 ? 'CANTRIP' : `LVL ${spell.level}`}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-gold-primary transition-colors line-clamp-1">
          {spell.name}
        </h3>

        {/* Meta Info */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
          <span className="flex items-center gap-1" title="Casting Time">
            <Clock className="w-3 h-3" /> {spell.casting_time}
          </span>
          <span className="flex items-center gap-1" title="Range">
            <Ruler className="w-3 h-3" /> {spell.range}
          </span>
        </div>

        {/* Footer Actions */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-dark-border/50">
          <div className="flex gap-1">
            {spell.components.includes('V') && <span className="text-[10px] text-gray-500 font-mono bg-dark-bg px-1 rounded" title="Verbal">V</span>}
            {spell.components.includes('S') && <span className="text-[10px] text-gray-500 font-mono bg-dark-bg px-1 rounded" title="Somatic">S</span>}
            {spell.components.includes('M') && <span className="text-[10px] text-gray-500 font-mono bg-dark-bg px-1 rounded" title="Material">M</span>}
          </div>
          
          {spell.level > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePrepare(spell);
              }}
              className={`text-xs font-bold px-2 py-1 rounded transition-colors ${
                isPrepared 
                  ? 'text-gold-primary bg-gold-primary/10 hover:bg-gold-primary/20' 
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              {isPrepared ? 'PREPARED' : 'PREPARE'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function FilterBar({ filters, setFilters, availableSchools }) {
  return (
    <div className="bg-dark-surface p-4 rounded-xl border border-dark-border shadow-lg mb-6 space-y-4">
      {/* Search & Main Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search spells by name..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2 text-white focus:border-gold-primary focus:outline-none transition-colors"
          />
        </div>
        
        <select
          value={filters.level}
          onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
          className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:border-gold-primary focus:outline-none"
        >
          <option value="all">All Levels</option>
          <option value="0">Cantrips</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => (
            <option key={lvl} value={lvl}>Level {lvl}</option>
          ))}
        </select>

        <select
          value={filters.school}
          onChange={(e) => setFilters(prev => ({ ...prev, school: e.target.value }))}
          className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:border-gold-primary focus:outline-none"
        >
          <option value="all">All Schools</option>
          {availableSchools.map(school => (
            <option key={school} value={school}>{school}</option>
          ))}
        </select>
      </div>

      {/* Toggles */}
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white">
          <input
            type="checkbox"
            checked={filters.preparedOnly}
            onChange={(e) => setFilters(prev => ({ ...prev, preparedOnly: e.target.checked }))}
            className="rounded border-dark-border bg-dark-bg text-gold-primary focus:ring-0"
          />
          <span>Prepared Only</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white">
          <input
            type="checkbox"
            checked={filters.ritualOnly}
            onChange={(e) => setFilters(prev => ({ ...prev, ritualOnly: e.target.checked }))}
            className="rounded border-dark-border bg-dark-bg text-gold-primary focus:ring-0"
          />
          <span>Rituals</span>
        </label>
      </div>
    </div>
  );
}

// --- Main Page Component ---

export default function Spells() {
  const { character, castSpell } = useCharacterStore();
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    level: 'all',
    school: 'all',
    preparedOnly: false,
    ritualOnly: false,
  });

  // --- Data Processing ---
  const spellsData = useMemo(() => {
    if (!character?.data?.spells) return [];
    
    // Flatten spells object into array
    const rawSpells = character.data.spells;
    let allSpells = [];

    if (Array.isArray(rawSpells)) {
      allSpells = rawSpells;
    } else {
      Object.entries(rawSpells).forEach(([key, value]) => {
        // Determine level from key (cantrips -> 0, level_1 -> 1)
        const level = key === 'cantrips' ? 0 : parseInt(key.replace('level_', '')) || 0;

        if (Array.isArray(value)) {
          allSpells = [...allSpells, ...value.map(s => ({ ...s, level }))];
        } else if (typeof value === 'object' && value !== null) {
          // Handle case where spells are in an object (id -> spell)
          const spellsFromLevel = Object.values(value).map(s => ({ ...s, level }));
          allSpells = [...allSpells, ...spellsFromLevel];
        }
      });
    }
    return allSpells;
  }, [character]);

  // Extract unique schools for filter
  const availableSchools = useMemo(() => {
    return [...new Set(spellsData.map(s => s.school).filter(Boolean))].sort();
  }, [spellsData]);

  // Filter Logic
  const filteredSpells = useMemo(() => {
    return spellsData.filter(spell => {
      const matchesSearch = spell.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesLevel = filters.level === 'all' || spell.level === parseInt(filters.level);
      const matchesSchool = filters.school === 'all' || spell.school === filters.school;
      const matchesPrepared = !filters.preparedOnly || spell.prepared || spell.always_prepared;
      const matchesRitual = !filters.ritualOnly || spell.ritual;

      return matchesSearch && matchesLevel && matchesSchool && matchesPrepared && matchesRitual;
    }).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }, [spellsData, filters]);

  // Mock Prepare Toggle (since store might not have it yet)
  const handleTogglePrepare = (spell) => {
    console.log('Toggling prepare for:', spell.name);
  };

  if (!character) return <div className="p-8 text-center text-gray-500">Loading Grimoire...</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-gold-primary mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            Grimoire
          </h1>
          <p className="text-gray-400">Manage your arcane knowledge and prepared spells.</p>
        </div>
        
        {/* Spell Slots Summary (Mini) */}
        <div className="flex gap-2">
          {Object.entries(character.data.spellcasting?.spell_slots || {}).map(([lvl, max]) => {
            const current = character.data.spellcasting?.spell_slots_current?.[lvl] || 0;
            return (
              <div key={lvl} className="flex flex-col items-center bg-dark-surface p-2 rounded border border-dark-border">
                <span className="text-[10px] text-gray-500 uppercase">Lvl {lvl}</span>
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: max }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 h-2 rounded-full ${i < current ? 'bg-gold-primary' : 'bg-dark-bg border border-gray-700'}`} 
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <FilterBar 
        filters={filters} 
        setFilters={setFilters} 
        availableSchools={availableSchools} 
      />

      {/* Spells Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {filteredSpells.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Scroll className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No spells found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
            <AnimatePresence>
              {filteredSpells.map((spell, idx) => (
                <SpellCard
                  key={`${spell.name}-${idx}`}
                  spell={spell}
                  isPrepared={spell.prepared || spell.always_prepared}
                  onTogglePrepare={handleTogglePrepare}
                  onClick={() => setSelectedSpell(spell)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <SpellDetailsModal
        spell={selectedSpell}
        onClose={() => setSelectedSpell(null)}
        onCast={async (spell) => {
          if (spell.level > 0) {
            await castSpell({
              level: spell.level,
              name: spell.name,
              duration: spell.duration,
              concentration: spell.concentration || spell.duration?.toLowerCase().includes('concentration')
            });
          }
        }}
      />
    </div>
  );
}