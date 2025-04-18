import { useState } from 'react';
import { User, Phone, Mail, Calendar, Flag } from 'lucide-react';

import { NATIONALITIES } from '../../../data/nationalities';

interface PersonalInfoStepProps {
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate: string;
    nationality: string;
  };
  onUpdate: (data: Partial<PersonalInfoStepProps['data']>) => void;
  onNext: () => void;
}

export default function PersonalInfoStep({ data, onUpdate, onNext }: PersonalInfoStepProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof PersonalInfoStepProps['data'], string>>>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    // Validate required fields
    if (!data.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!data.lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!data.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Email invalide';
    }
    if (!data.phone.trim()) newErrors.phone = 'Le téléphone est requis';
    if (!data.birthDate) newErrors.birthDate = 'La date de naissance est requise';
    if (!data.nationality.trim()) newErrors.nationality = 'La nationalité est requise';

    // Validate birth date (must be at least 18 years old)
    if (data.birthDate) {
      const birthDate = new Date(data.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        newErrors.birthDate = 'Vous devez avoir au moins 18 ans';
      }
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Prénom
          </label>
          <div className="mt-1 relative">
            <input
              type="text"
              value={data.firstName}
              onChange={(e) => onUpdate({ firstName: e.target.value })}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nom
          </label>
          <div className="mt-1 relative">
            <input
              type="text"
              value={data.lastName}
              onChange={(e) => onUpdate({ lastName: e.target.value })}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
          )}
        </div>
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
            className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
              errors.email ? 'border-red-500' : 'border-gray-300'
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
          Téléphone
        </label>
        <div className="mt-1 relative">
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
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
          Date de naissance
        </label>
        <div className="mt-1 relative">
          <input
            type="date"
            value={data.birthDate}
            onChange={(e) => onUpdate({ birthDate: e.target.value })}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
              errors.birthDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        {errors.birthDate && (
          <p className="mt-1 text-sm text-red-500">{errors.birthDate}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Nationalité
          <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative">
          <select
            value={data.nationality}
            onChange={(e) => onUpdate({ nationality: e.target.value })}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
              errors.nationality ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Sélectionner une nationalité</option>
            {NATIONALITIES.map(nationality => (
              <option key={nationality.code} value={nationality.code}>
                {nationality.name}
              </option>
            ))}
          </select>
          <Flag className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        {errors.nationality && (
          <p className="mt-1 text-sm text-red-500">{errors.nationality}</p>
        )}
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