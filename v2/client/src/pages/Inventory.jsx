import { useCharacterStore } from '../store/characterStore';

export default function Inventory() {
  const { character } = useCharacterStore();
  const inventory = character?.data?.inventory || {};
  const money = character?.data?.money || {};

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gold-primary mb-6">🎒 Inventory</h2>

      {/* Money */}
      <div className="card">
        <h3 className="text-xl font-bold text-gold-primary mb-4">💰 Currency</h3>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(money).map(([coin, amount]) => (
            <div key={coin} className="bg-dark-bg p-4 rounded-lg text-center">
              <div className="text-gold-secondary font-bold text-sm mb-2">{coin.toUpperCase()}</div>
              <div className="text-2xl font-bold text-white">{amount}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div className="card">
        <h3 className="text-xl font-bold text-gold-primary mb-4">⚔️ Equipment</h3>
        <div className="space-y-2">
          {Object.entries(inventory).map(([itemId, item]) => (
            <div key={itemId} className="bg-dark-bg p-3 rounded-lg">
              <div className="font-bold text-gold-secondary">{item.name}</div>
              <div className="text-sm text-gray-400">{item.description}</div>
              {item.quantity && <div className="text-sm text-white">Quantity: {item.quantity}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="card">
        <h3 className="text-xl font-bold text-gold-primary mb-4">📝 Session Notes</h3>
        <textarea className="w-full h-40 bg-dark-bg border-2 border-dark-medium focus:border-gold-primary text-white p-4 rounded-lg outline-none resize-none" placeholder="Your session notes here..."></textarea>
      </div>
    </div>
  );
}
