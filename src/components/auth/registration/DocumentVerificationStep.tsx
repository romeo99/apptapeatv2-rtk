import { useState } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';

interface DocumentVerificationStepProps {
  data: {
    identityDocument: File | null;
    businessRegistration: File | null;
    bankStatement: File | null;
  };
  onUpdate: (data: Partial<DocumentVerificationStepProps['data']>) => void;
  onNext: () => void;
  onCompleteLater: () => void;
}

export default function DocumentVerificationStep({
  data,
  onUpdate,
  onNext,
  onCompleteLater
}: DocumentVerificationStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleFileChange = (field: keyof DocumentVerificationStepProps['data']) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [field]: 'Le fichier ne doit pas dépasser 5MB'
      }));
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        [field]: 'Format de fichier non supporté (JPG, PNG ou PDF uniquement)'
      }));
      return;
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });

    onUpdate({ [field]: file });
  };

  const removeFile = (field: keyof DocumentVerificationStepProps['data']) => {
    onUpdate({ [field]: null });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!data.identityDocument) {
      newErrors.identityDocument = 'Une pièce d\'identité est requise';
    }
    if (!data.businessRegistration) {
      newErrors.businessRegistration = 'Le document d\'immatriculation est requis';
    }
    if (!data.bankStatement) {
      newErrors.bankStatement = 'Un relevé bancaire est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  const handleCompleteLater = () => {
    setShowConfirmation(true);
  };

  const confirmCompleteLater = () => {
    // Show success message
    const successModal = document.createElement('div');
    successModal.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
          <h3 class="text-lg font-semibold mb-2">Inscription réussie !</h3>
          <p class="text-gray-600 mb-4">
            Votre compte a été créé avec succès. Vous pourrez compléter la vérification plus tard depuis votre tableau de bord.
          </p>
          <button class="w-full py-2 bg-emerald-500 text-white rounded-lg">
            Continuer
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(successModal);

    // Remove modal and redirect after 2 seconds
    setTimeout(() => {
      document.body.removeChild(successModal);
      onCompleteLater();
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Documents requis pour la vérification
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Pièce d'identité en cours de validité</li>
                <li>Document d'immatriculation de l'entreprise</li>
                <li>Relevé bancaire professionnel</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Pièce d'identité
          </label>
          <div className="mt-1">
            {data.identityDocument ? (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">
                  {data.identityDocument.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile('identityDocument')}
                  className="p-1 hover:bg-gray-200 rounded-full"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            ) : (
              <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer rounded-md font-medium text-emerald-600 hover:text-emerald-500">
                      <span>Télécharger un fichier</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileChange('identityDocument')}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG ou PDF jusqu'à 5MB
                  </p>
                </div>
              </div>
            )}
            {errors.identityDocument && (
              <p className="mt-1 text-sm text-red-500">{errors.identityDocument}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Document d'immatriculation
          </label>
          <div className="mt-1">
            {data.businessRegistration ? (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">
                  {data.businessRegistration.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile('businessRegistration')}
                  className="p-1 hover:bg-gray-200 rounded-full"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            ) : (
              <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer rounded-md font-medium text-emerald-600 hover:text-emerald-500">
                      <span>Télécharger un fichier</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileChange('businessRegistration')}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG ou PDF jusqu'à 5MB
                  </p>
                </div>
              </div>
            )}
            {errors.businessRegistration && (
              <p className="mt-1 text-sm text-red-500">{errors.businessRegistration}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Relevé bancaire
          </label>
          <div className="mt-1">
            {data.bankStatement ? (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">
                  {data.bankStatement.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile('bankStatement')}
                  className="p-1 hover:bg-gray-200 rounded-full"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            ) : (
              <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer rounded-md font-medium text-emerald-600 hover:text-emerald-500">
                      <span>Télécharger un fichier</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileChange('bankStatement')}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG ou PDF jusqu'à 5MB
                  </p>
                </div>
              </div>
            )}
            {errors.bankStatement && (
              <p className="mt-1 text-sm text-red-500">{errors.bankStatement}</p>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleCompleteLater}
            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Compléter plus tard
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            Suivant
          </button>
        </div>
      </form>
      
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Êtes-vous sûr ?</h3>
            <p className="text-gray-600 mb-4">
              Vous pourrez compléter la vérification plus tard, mais certaines fonctionnalités seront limitées jusqu'à ce que tous les documents soient validés.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmCompleteLater}
                className="flex-1 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}