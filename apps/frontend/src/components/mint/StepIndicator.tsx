import React from 'react'
import { Check } from 'lucide-react'

export interface StepConfig {
  id: number
  title: string
  icon: React.ElementType
  description: string
}

export interface StepIndicatorProps {
  steps: StepConfig[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${currentStep >= step.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-200 text-secondary-600'
                  }
                `}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-primary-600' : 'text-secondary-600'
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-secondary-500">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-primary-600' : 'bg-secondary-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
