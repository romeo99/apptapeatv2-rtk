import { ChevronDown, Mail, MessageCircle, Phone } from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import useOrderNotification from '../../hooks/useOrderNotification';
import { useTawkTo } from '../../hooks/useTawkTo';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Comment modifier mes horaires d'ouverture ?",
    answer: "Vous pouvez modifier vos horaires dans la section \"Paramètres\" puis \"Mon restaurant\". N'oubliez pas de sauvegarder vos modifications."
  },
  {
    question: "Comment ajouter un nouveau produit ?",
    answer: "Rendez-vous dans la section Menu, cliquez sur \"Nouveau produit\" et remplissez les informations nécessaires."
  },
  {
    question: "Comment gérer mes commandes ?",
    answer: "Toutes vos commandes en cours sont visibles dans la section \"Commandes en direct\". Vous pouvez les gérer en temps réel et suivre leur statut."
  },
  {
    question: "Comment configurer mes moyens de paiement ?",
    answer: "Accédez à la section \"Paramètres\" puis \"Options\" pour configurer les moyens de paiement acceptés dans votre établissement."
  }
];

export default function Support() {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  useTawkTo('675554292480f5b4f5aa617f/1ieil1h9b');
  const [isChatOpen, setIsChatOpen] = useState(false);

  useOrderNotification();

  const toggleChat = () => {
    if (window.Tawk_API) {
      if (isChatOpen) {
        window.Tawk_API.minimize();
      } else {
        window.Tawk_API.maximize();
      }
      setIsChatOpen(!isChatOpen);
    }
  };

  return (
    <AdminLayout>
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          <p className="mt-1 text-sm text-gray-500">
            Besoin d'aide ? Nous sommes là pour vous.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Contact direct */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Phone className="h-5 w-5 text-emerald-500" />
              Contact direct
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <a href="tel:0609010203" className="text-emerald-600 font-medium">
                    06 09 01 02 03
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a href="mailto:support@tapeat.fr" className="text-emerald-600 font-medium">
                    support@tapeat.fr
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Live Chat */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Chat en direct</h2>
              <p className="text-gray-600 mb-4">
                Notre équipe est disponible en chat du lundi au vendredi de 9h à 18h.
              </p>
              <button
                onClick={toggleChat}
                className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                {isChatOpen ? 'Fermer le chat' : 'Démarrer une conversation'}
              </button>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-6">Questions fréquentes</h2>
          <div className="divide-y">
            {FAQ_ITEMS.map((item, index) => (
              <div key={index} className="py-4">
                <button
                  onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h3 className="font-medium pr-4">{item.question}</h3>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-500 transition-transform ${expandedItem === index ? 'transform rotate-180' : ''
                      }`}
                  />
                </button>
                {expandedItem === index && (
                  <p className="mt-2 text-gray-600 pl-4 border-l-2 border-emerald-500">
                    {item.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}