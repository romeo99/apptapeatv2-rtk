/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import SuperAdminLayout from '../../components/superadmin/SuperAdminLayout';
import { getApplicationFee, updateApplicationFee } from '../../services/superadminService';

export default function Finances() {
  const [commission, setCommission] = useState<number>(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadCommission();
  }, []);

  const loadCommission = async () => {
    try {
      const fee = await getApplicationFee();
      setCommission(fee * 100);
    } catch (err) {
      setError('Erreur lors du chargement de la commission');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await updateApplicationFee(commission / 100, user.uid);
      setSuccess('Commission mise à jour avec succès');
    } catch (err) {
      setError('Erreur lors de la mise à jour de la commission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Configuration des Finances</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="commission" className="block text-sm font-medium text-gray-700">
                Commission (%)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input type="number" min="0" max="100" step="0.1" name="commission" id="commission" value={commission} onChange={(e) => setCommission(Number(e.target.value))} className="block w-full p-2 border pr-10  text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md placeholder-gray-400" placeholder="Enter commission" disabled={loading} />

                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">Note: Veuillez consulter la page de tarification Stripe pour plus de détails sur les frais applicables.</p>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>}

            {success && <div className="bg-green-50 text-green-700 p-4 rounded-md">{success}</div>}

            <div>
              <button type="submit" disabled={loading} className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {loading ? 'Chargement...' : 'Mettre à jour la commission'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
