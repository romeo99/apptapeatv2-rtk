import { AlertCircle, ChevronLeft, Copy, Download, Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/admin/AdminLayout';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useRestaurantContext } from '../../../context/RestaurantContext';
import useOrderNotification from '../../../hooks/useOrderNotification';
import { deleteQRCode, downloadQRCode, generateQRCode, getQRCodes, QRCodeData } from '../../../services/qrCodeService';

export default function QrCodeSettings() {
  const navigate = useNavigate();
  const { restaurant } = useRestaurantContext();
  const [qrCodes, setQRCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewQRForm, setShowNewQRForm] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    tableNumber: ''
  });
  const [generating, setGenerating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useOrderNotification();

  useEffect(() => {
    if (!restaurant?.id) return;
    loadQRCodes();
  }, [restaurant?.id]);

  const loadQRCodes = async () => {
    try {
      setLoading(true);
      const codes = await getQRCodes(restaurant!.id, 'restaurant');
      setQRCodes(codes);
    } catch (err) {
      console.error('Error loading QR codes:', err);
      setError('Erreur lors du chargement des QR codes');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.id) {
      setActionError('Restaurant ID manquant');
      return;
    }

    if (!formData.label.trim()) {
      setActionError('Le nom du QR code est requis');
      return;
    }

    try {
      setGenerating(true);
      setActionError(null);

      await generateQRCode(restaurant.id, {
        label: formData.label,
        tableNumber: formData.tableNumber || undefined,
        type: 'restaurant' // Force restaurant type for restaurant admin
      });

      await loadQRCodes();
      setShowNewQRForm(false);
      setFormData({ label: '', tableNumber: '' });
    } catch (error) {
      console.error('Error generating QR code:', error);
      setActionError('Erreur lors de la génération du QR code');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert('URL copiée !');
    } catch (error) {
      console.error('Error copying URL:', error);
      setActionError('Erreur lors de la copie du lien');
    }
  };

  const handleDownloadQR = (qrCode: any) => {
    try {
      downloadQRCode(qrCode.qrCodeImage, qrCode.label);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      setActionError('Erreur lors du téléchargement du QR code');
    }
  };

  const handleDeleteQR = async (qrCodeId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce QR code ?')) {
      return;
    }
    if (!restaurant?.id || !qrCodeId) {
      setActionError('Impossible de supprimer le QR code');
      return;
    }

    try {
      setActionError(null);
      await deleteQRCode(restaurant.id, qrCodeId, 'restaurant');
      await loadQRCodes(); // Reload the list after deletion
    } catch (error) {
      console.error('Error deleting QR code:', error);
      setActionError('Erreur lors de la suppression du QR code');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/settings')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Mes QR Codes</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {actionError && (
          <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{actionError}</p>
          </div>
        )}

        {!showNewQRForm ? (
          <div className="mb-6">
            <button
              onClick={() => setShowNewQRForm(true)}
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-600"
            >
              <Plus className="h-5 w-5" />
              Générer un nouveau QR code
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Nouveau QR code
            </h2>

            <form onSubmit={handleGenerateQR} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Ex: Table 1, Bar, Terrasse..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de table
                  <span className="text-sm font-normal text-gray-500 ml-1">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={formData.tableNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, tableNumber: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Ex: 1, 2, 3..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewQRForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {generating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {generating ? 'Génération...' : 'Générer le QR code'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="min-w-full divide-y divide-gray-200">
            <div className="bg-gray-50 px-6 py-3">
              <h2 className="text-lg font-medium text-gray-900">
                QR codes générés
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {qrCodes.map((qrCode) => (
                <div key={qrCode.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <img
                          src={qrCode.qrCodeImage}
                          alt={`QR code pour ${qrCode.label}`}
                          className="w-12 h-12"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{qrCode.label}</h3>
                        {qrCode.tableNumber && (
                          <p className="text-sm text-gray-500">
                            Table n°{qrCode.tableNumber}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          Créé le {qrCode.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyUrl(qrCode.url)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                        title="Copier le lien"
                      >
                        <Copy className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDownloadQR(qrCode)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                        title="Télécharger"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => qrCode.id && handleDeleteQR(qrCode.id)}
                        className="p-2 text-red-400 hover:text-red-600 rounded-lg"
                        title="Supprimer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {qrCodes.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  Aucun QR code généré
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}