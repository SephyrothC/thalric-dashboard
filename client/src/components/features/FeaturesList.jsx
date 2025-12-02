import { useState, useMemo } from 'react';
import FeatureCard from './FeatureCard';
import { AnimatePresence } from 'framer-motion';

export default function FeaturesList({ features, onUseFeature }) {
  const [filter, setFilter] = useState('all'); // all | active | passive
  const [sortBy, setSortBy] = useState('type'); // type | source

  const filteredFeatures = useMemo(() => {
    let result = [...features];

    // Filter
    if (filter === 'active') result = result.filter(f => f.type === 'active');
    if (filter === 'passive') result = result.filter(f => f.type === 'passive');

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'type') {
        // Active first, then Passive
        if (a.type !== b.type) return a.type === 'active' ? -1 : 1;
        // Then by activation type (Action > Bonus > Reaction)
        const order = { action: 1, bonus_action: 2, reaction: 3, none: 4 };
        return (order[a.activation] || 99) - (order[b.activation] || 99);
      }
      if (sortBy === 'source') {
        return a.source.localeCompare(b.source);
      }
      return 0;
    });

    return result;
  }, [features, filter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-dark-surface p-4 rounded-xl border border-dark-border">
        {/* Filter Tabs */}
        <div className="flex bg-dark-bg p-1 rounded-lg">
          {['all', 'active', 'passive'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-bold capitalize transition-all ${
                filter === f 
                  ? 'bg-dark-surface text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase font-bold">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm text-white focus:border-gold-primary focus:outline-none"
          >
            <option value="type">Action Type</option>
            <option value="source">Source</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredFeatures.map(feature => (
            <FeatureCard 
              key={feature.id} 
              feature={feature} 
              onUse={onUseFeature} 
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
