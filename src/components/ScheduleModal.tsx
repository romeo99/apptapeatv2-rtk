import { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string, time: string) => void;
}

export default function ScheduleModal({ isOpen, onClose, onConfirm }: ScheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [step, setStep] = useState<'date' | 'time'>('date');

  if (!isOpen) return null;

  // Get available dates (next 7 days)
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  // Get available time slots (every 15 minutes between 11:00 and 23:00)
  const timeSlots = [];
  for (let hour = 11; hour < 23; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push({
        time,
        label: new Date(`2000-01-01T${time}`).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        })
      });
    }
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    onConfirm(selectedDate, time);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="h-full flex flex-col justify-end">
          <div className="relative bg-white w-full rounded-t-2xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {step === 'date' ? 'Choisir une date' : 'Choisir une heure'}
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-4">
              {step === 'date' ? (
                <div className="space-y-3">
                  {dates.map((date) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    const dateStr = date.toISOString().split('T')[0];
                    
                    return (
                      <button
                        key={dateStr}
                        onClick={() => handleDateSelect(dateStr)}
                        className="w-full flex items-center justify-between p-4 rounded-xl border hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                      >
                        <div className="text-left">
                          <div className="font-medium">
                            {isToday ? "Aujourd'hui" : date.toLocaleDateString('fr-FR', { weekday: 'long' })}
                          </div>
                          <div className="text-sm text-gray-500">
                            {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {timeSlots.map(({ time, label }) => (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      className="p-3 rounded-xl border hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-center"
                    >
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}