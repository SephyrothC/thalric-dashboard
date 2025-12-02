import { useState, useEffect } from 'react';
import { useCharacterStore } from '../store/characterStore';

export default function Inventory() {
  const { character, fetchCharacter } = useCharacterStore();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'success' or 'error'
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [currencyValue, setCurrencyValue] = useState('');
  const [savingCurrency, setSavingCurrency] = useState(false);
  
  // Charger les notes au montage du composant
  useEffect(() => {
    if (character?.data?.session_notes) {
      setNotes(character.data.session_notes);
    }
  }, [character]);

  if (!character || !character.data) {
    return <div className="text-white p-6">Loading character data...</div>;
  }

  // Gérer les différentes structures possibles
  const inventory = character.data.inventory || character.data.equipment || {};
  const money = character.data.money || {};

  // Convertir inventory en array si c'est un objet
  const inventoryItems = Array.isArray(inventory) 
    ? inventory 
    : Object.entries(inventory).map(([id, item]) => ({ id, ...item }));

  // Monnaies par défaut si non définies
  const currencies = {
    pp: money.pp || 0,
    gp: money.gp || 0,
    ep: money.ep || 0,
    sp: money.sp || 0,
    cp: money.cp || 0
  };

  const currencyNames = {
    pp: 'PP',
    gp: 'GP',
    ep: 'EP',
    sp: 'SP',
    cp: 'CP'
  };

  // Handle currency edit
  const handleCurrencyClick = (coin) => {
    setEditingCurrency(coin);
    setCurrencyValue(currencies[coin].toString());
  };

  const handleCurrencyChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCurrencyValue(value);
  };

  const handleCurrencySave = async () => {
    if (editingCurrency === null) return;
    
    setSavingCurrency(true);
    try {
      const newMoney = { ...currencies, [editingCurrency]: parseInt(currencyValue) || 0 };
      
      const response = await fetch(`${window.location.origin}/api/character/money`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ money: newMoney })
      });

      if (!response.ok) throw new Error('Failed to save currency');

      await fetchCharacter();
      setEditingCurrency(null);
    } catch (error) {
      console.error('Error saving currency:', error);
    } finally {
      setSavingCurrency(false);
    }
  };

  const handleCurrencyKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCurrencySave();
    } else if (e.key === 'Escape') {
      setEditingCurrency(null);
    }
  };

  // Sauvegarder les notes
  const handleSaveNotes = async () => {
    setSaving(true);
    setSaveStatus('');

    try {
      const response = await fetch(`${window.location.origin}/api/character/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });

      if (!response.ok) throw new Error('Failed to save notes');

      setSaveStatus('success');
      
      // Cacher le message après 3 secondes
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving notes:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gold-primary mb-6">🎒 Inventory</h2>

      {/* Money */}
      <div className="card">
        <h3 className="text-xl font-bold text-gold-primary mb-4">💰 Currency</h3>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(currencies).map(([coin, amount]) => (
            <div 
              key={coin} 
              className="bg-dark-bg p-4 rounded-lg text-center hover:bg-dark-light transition-colors cursor-pointer"
              onClick={() => !editingCurrency && handleCurrencyClick(coin)}
            >
              <div className="text-gold-secondary font-bold text-sm mb-2">{currencyNames[coin]}</div>
              {editingCurrency === coin ? (
                <input
                  type="text"
                  value={currencyValue}
                  onChange={handleCurrencyChange}
                  onKeyDown={handleCurrencyKeyDown}
                  onBlur={handleCurrencySave}
                  autoFocus
                  disabled={savingCurrency}
                  className="w-full text-2xl font-bold text-black text-center bg-white border-2 border-gold-primary rounded outline-none"
                />
              ) : (
                <div className="text-2xl font-bold text-white">{amount}</div>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">Click on a value to edit</p>
      </div>

      {/* Equipment */}
      <div className="card">
        <h3 className="text-xl font-bold text-gold-primary mb-4">⚔️ Equipment & Items</h3>
        {inventoryItems.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            <p className="text-lg mb-2">No items in inventory</p>
            <p className="text-sm">Add items to your thalric_data.json under "inventory" or "equipment"</p>
          </div>
        ) : (
          <div className="space-y-2">
            {inventoryItems.map((item, index) => (
              <div key={item.id || index} className="bg-dark-bg p-4 rounded-lg hover:bg-dark-light transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-bold text-gold-secondary text-lg">
                      {item.name || 'Unnamed Item'}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {item.description || 'No description available'}
                    </div>
                    {item.type && (
                      <div className="text-xs text-gold-primary mt-2">
                        Type: {item.type}
                      </div>
                    )}
                  </div>
                  {item.quantity !== undefined && (
                    <div className="ml-4 bg-dark-medium px-3 py-1 rounded-full">
                      <span className="text-white font-bold">×{item.quantity}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="card">
        <h3 className="text-xl font-bold text-gold-primary mb-4">📝 Session Notes</h3>
        <textarea 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full h-40 bg-dark-bg border-2 border-dark-medium focus:border-gold-primary text-white p-4 rounded-lg outline-none resize-none transition-colors"
          placeholder="Write your session notes here...
          
• Important NPCs
• Quest objectives  
• Loot to remember
• Party decisions"
        />
        <div className="mt-2 flex justify-between items-center">
          <div>
            {saveStatus === 'success' && (
              <span className="text-green-500 font-semibold">✅ Notes saved successfully!</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-500 font-semibold">❌ Failed to save notes</span>
            )}
          </div>
          <button 
            onClick={handleSaveNotes}
            disabled={saving}
            className={`btn-primary ${saving ? 'opacity-50 cursor-wait' : ''}`}
          >
            {saving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  );
}