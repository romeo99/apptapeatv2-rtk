import { useLoadScript } from '@react-google-maps/api';
import { Building2, FileText, Mail, MapPin, Phone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface BasicInfoStepProps {
  data: {
    name: string;
    address: string;
    phone: string;
    email: string;
    description: string;
  };
  onUpdate: (data: Partial<BasicInfoStepProps['data']>) => void;
  onNext: () => void;
}

export default function BasicInfoStep({ data, onUpdate, onNext }: BasicInfoStepProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof BasicInfoStepProps['data'], string>>>({});
  const addressInputRef = useRef<HTMLInputElement>(null);
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: 'AIzaSyBi3DoK4uEJmMfyjnSCLoQ_hxIv-h-Cbf4',
    libraries: ['places']
  });

  useEffect(() => {
    if (isLoaded && addressInputRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(addressInputRef.current, {
        componentRestrictions: { country: 'FR' },
        fields: ['formatted_address', 'geometry']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry?.location && place.formatted_address) {
          onUpdate({ address: place.formatted_address });
        }
      });
    }
  }, [isLoaded, onUpdate]);

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!data.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    if (!data.address.trim()) {
      newErrors.address = 'L\'adresse est requise';
    }
    if (!data.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    }
    if (!data.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Email invalide';
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Nom du restaurant
        </label>
        <div className="mt-1 relative">
          <input
            type="text"
            value={data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
          />
          <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Adresse
        </label>
        <div className="mt-1 relative">
          <input
            ref={addressInputRef}
            type="text"
            value={data.address}
            onChange={(e) => onUpdate({ address: e.target.value })}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg ${errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Entrez l'adresse du restaurant"
          />
          <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        {errors.address && (
          <p className="mt-1 text-sm text-red-500">{errors.address}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Téléphone
        </label>
        <div className="mt-1 relative">
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg ${errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
          />
          <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        {errors.phone && (
          <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <div className="mt-1 relative">
          <input
            type="email"
            value={data.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
          />
          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <div className="mt-1 relative">
          <textarea
            value={data.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            rows={4}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
          <FileText className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
        >
          Suivant
        </button>
      </div>
    </form>
  );
}