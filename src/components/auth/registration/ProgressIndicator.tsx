import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  steps: Array<{
    id: string;
    label: string;
  }>;
  currentStep: number;
}

export default function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
    <div className="relative">
      {/* Progress bar */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2">
        <div 
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div key={step.id} className="flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isCompleted ? 'bg-emerald-500 text-white' :
                  isCurrent ? 'bg-emerald-100 text-emerald-600 ring-4 ring-emerald-50' :
                  'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className={`mt-2 text-xs text-center transition-colors duration-500 ${
                isCompleted ? 'text-emerald-600 font-medium' :
                isCurrent ? 'text-gray-900 font-medium' :
                'text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}