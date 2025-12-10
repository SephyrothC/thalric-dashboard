import { useState, useEffect, useMemo } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { 
  Backpack, 
  Coins, 
  Swords, 
  StickyNote, 
  Save, 
  CheckCircle, 
  XCircle,
  Shield,
  Sparkles,
  Package,
  FlaskConical,
  Plus,
  Minus,
  Trash2,
  X
} from 'lucide-react';

export default function Inventory() {
  const { character, fetchCharacter } = useCharacterStore();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'success' or 'error'
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [currencyValue, setCurrencyValue] = useState('');
  const [savingCurrency, setSavingCurrency] = useState(false);
  
  // Add item modal state
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    type: 'Adventuring Gear',
    rarity: 'common',
    description: '',
    quantity: 1
  });
  const [addingItem, setAddingItem] = useState(false);
  
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

  // Séparer l'équipement des objets
  const { equipment, items } = useMemo(() => {
    const equipmentTypes = [
      'Heavy Armor', 'Medium Armor', 'Light Armor', 'Shield',
      'Martial Weapon', 'Simple Weapon', 'Ranged Weapon',
      'Wondrous Item', 'Ring', 'Amulet', 'Holy Symbol'
    ];
    
    const equipment = [];
    const items = [];
    
    inventoryItems.forEach(item => {
      // Un objet est de l'équipement s'il est équipé OU s'il a un type d'équipement
      const isEquipment = item.equipped || 
        item.attunement || 
        equipmentTypes.some(type => item.type?.includes(type));
      
      if (isEquipment) {
        equipment.push(item);
      } else {
        items.push(item);
      }
    });
    
    // Trier l'équipement: équipé d'abord, puis par rareté
    const rarityOrder = { legendary: 0, 'very rare': 1, rare: 2, uncommon: 3, common: 4 };
    equipment.sort((a, b) => {
      if (a.equipped !== b.equipped) return a.equipped ? -1 : 1;
      return (rarityOrder[a.rarity?.toLowerCase()] || 5) - (rarityOrder[b.rarity?.toLowerCase()] || 5);
    });
    
    return { equipment, items };
  }, [inventoryItems]);

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

  // Item types for dropdown
  const itemTypes = [
    'Adventuring Gear',
    'Potion',
    'Food',
    'Gemstone',
    'Scroll',
    'Tool',
    'Component',
    'Ammunition',
    'Other'
  ];

  // Add new item
  const handleAddItem = async () => {
    if (!newItem.name.trim()) return;
    
    setAddingItem(true);
    try {
      const response = await fetch(`${window.location.origin}/api/character/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: newItem })
      });

      if (!response.ok) throw new Error('Failed to add item');

      await fetchCharacter();
      setShowAddItemModal(false);
      setNewItem({
        name: '',
        type: 'Adventuring Gear',
        rarity: 'common',
        description: '',
        quantity: 1
      });
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setAddingItem(false);
    }
  };

  // Update item quantity
  const handleUpdateQuantity = async (itemId, delta) => {
    try {
      const response = await fetch(`${window.location.origin}/api/character/inventory/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta })
      });

      if (!response.ok) throw new Error('Failed to update item');

      await fetchCharacter();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId) => {
    if (!confirm('Delete this item?')) return;
    
    try {
      const response = await fetch(`${window.location.origin}/api/character/inventory/${itemId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete item');

      await fetchCharacter();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
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
      <h2 className="text-3xl font-bold text-gold-primary mb-6 flex items-center gap-3">
        <Backpack className="w-8 h-8" />
        Inventory
      </h2>

      {/* Money */}
      <div className="card">
        <h3 className="text-xl font-bold text-gold-primary mb-4 flex items-center gap-2">
          <Coins className="w-5 h-5" />
          Currency
        </h3>
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

      {/* Equipment Section */}
      <div className="card">
        <h3 className="text-xl font-bold text-gold-primary mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Equipment
        </h3>
        {equipment.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            <p className="text-lg mb-2">No equipment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {equipment.map((item, index) => (
              <div 
                key={item.id || index} 
                className={`bg-dark-bg p-4 rounded-lg hover:bg-dark-light transition-colors border-l-4 ${
                  item.equipped ? 'border-green-500' : 'border-gray-600'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-lg ${
                        item.rarity === 'legendary' ? 'text-orange-400' :
                        item.rarity === 'very rare' ? 'text-purple-400' :
                        item.rarity === 'rare' ? 'text-blue-400' :
                        item.rarity === 'uncommon' ? 'text-green-400' :
                        'text-gray-300'
                      }`}>
                        {item.name || 'Unnamed Item'}
                      </span>
                      {item.attunement && (
                        <span className="bg-purple-600/30 text-purple-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Attuned
                        </span>
                      )}
                      {item.equipped && (
                        <span className="bg-green-600/30 text-green-300 text-xs px-2 py-0.5 rounded-full">
                          Equipped
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {item.description || 'No description available'}
                    </div>
                    <div className="flex gap-3 mt-2 text-xs">
                      {item.type && (
                        <span className="text-gold-primary">
                          {item.type}
                        </span>
                      )}
                      {item.rarity && (
                        <span className="text-gray-500 capitalize">
                          {item.rarity}
                        </span>
                      )}
                      {item.charges !== undefined && (
                        <span className="text-cyan-400">
                          Charges: {item.charges}/{item.charges_max}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Items Section */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gold-primary flex items-center gap-2">
            <Package className="w-5 h-5" />
            Items & Consumables
          </h3>
          <button
            onClick={() => setShowAddItemModal(true)}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-sm flex items-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
        {items.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            <p className="text-lg mb-2">No items</p>
            <p className="text-sm">Click "Add Item" to add consumables, potions, etc.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((item, index) => (
              <div 
                key={item.id || index} 
                className="bg-dark-bg p-4 rounded-lg hover:bg-dark-light transition-colors group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {item.type?.includes('Potion') && <FlaskConical className="w-4 h-4 text-pink-400" />}
                      <span className={`font-bold ${
                        item.rarity === 'very rare' ? 'text-purple-400' :
                        item.rarity === 'rare' ? 'text-blue-400' :
                        item.rarity === 'uncommon' ? 'text-green-400' :
                        'text-gray-300'
                      }`}>
                        {item.name || 'Unnamed Item'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {item.description || 'No description available'}
                    </div>
                    {item.type && (
                      <div className="text-xs text-gold-primary mt-2">
                        {item.type}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-1 bg-dark-medium rounded-lg p-1">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-red-400 hover:bg-red-600/30 rounded transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-white font-bold px-2 min-w-[24px] text-center">
                        {item.quantity || 1}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-green-400 hover:bg-green-600/30 rounded transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-600/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gold-primary">Add New Item</h3>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Potion of Healing"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:border-gold-primary outline-none"
                />
              </div>
              
              {/* Type */}
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Type</label>
                <select
                  value={newItem.type}
                  onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:border-gold-primary outline-none"
                >
                  {itemTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              {/* Rarity */}
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Rarity</label>
                <select
                  value={newItem.rarity}
                  onChange={(e) => setNewItem({ ...newItem, rarity: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:border-gold-primary outline-none"
                >
                  <option value="common">Common</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="rare">Rare</option>
                  <option value="very rare">Very Rare</option>
                  <option value="legendary">Legendary</option>
                </select>
              </div>
              
              {/* Quantity */}
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Quantity</label>
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                  min="1"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:border-gold-primary outline-none"
                />
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Item description..."
                  rows={3}
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:border-gold-primary outline-none resize-none"
                />
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="flex-1 px-4 py-2 bg-dark-bg hover:bg-dark-light border border-dark-border text-gray-300 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={!newItem.name.trim() || addingItem}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
              >
                {addingItem ? 'Adding...' : <><Plus className="w-4 h-4" /> Add Item</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="card">
        <h3 className="text-xl font-bold text-gold-primary mb-4 flex items-center gap-2">
          <StickyNote className="w-5 h-5" />
          Session Notes
        </h3>
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
              <span className="text-green-500 font-semibold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Notes saved successfully!
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-500 font-semibold flex items-center gap-1">
                <XCircle className="w-4 h-4" /> Failed to save notes
              </span>
            )}
          </div>
          <button 
            onClick={handleSaveNotes}
            disabled={saving}
            className={`btn-primary flex items-center gap-2 ${saving ? 'opacity-50 cursor-wait' : ''}`}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  );
}