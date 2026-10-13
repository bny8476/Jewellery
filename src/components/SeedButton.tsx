import { useState } from 'react';
import { seedDatabase } from '../lib/seedData';
import { Gem, Plus } from 'lucide-react';

export default function SeedButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Never render seed button in production builds
  if (!import.meta.env.DEV) {
    return null;
  }

  const handleSeed = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      await seedDatabase();
      setMessage('Sample jewelry items added successfully! Refresh the page to see them.');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch {
      setMessage('Error adding items. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleSeed}
        disabled={loading}
        className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 flex items-center disabled:opacity-75"
      >
        {loading ? (
          <>
            <Gem className="h-4 w-4 mr-2 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Add Sample Jewelry
          </>
        )}
      </button>
      {message && (
        <div className="absolute bottom-full right-0 mb-2 bg-gray-800 text-white px-3 py-2 rounded text-sm whitespace-nowrap">
          {message}
        </div>
      )}
    </div>
  );
}
