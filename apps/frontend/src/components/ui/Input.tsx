import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    helperText?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    fullWidth?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            fullWidth = false,
            id,
            ...props
        },
        ref
    ) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

        return (
            <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium text-gray-900"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-500">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            'w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm transition-colors',
                            'placeholder:text-secondary-400',
                            'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-secondary-50',
                            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                            leftIcon && 'pl-10',
                            rightIcon && 'pr-10',
                            className
                        )}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-500">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="text-xs text-red-600">{error}</p>
                )}
                {helperText && !error && (
                    <p className="text-xs text-secondary-500">{helperText}</p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: string
    helperText?: string
    fullWidth?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        {
            className,
            label,
            error,
            helperText,
            fullWidth = false,
            id,
            ...props
        },
        ref
    ) => {
        const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

        return (
            <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="text-sm font-medium text-gray-900"
                    >
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    className={cn(
                        'w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm transition-colors',
                        'placeholder:text-secondary-400',
                        'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-secondary-50',
                        'resize-y min-h-[100px]',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="text-xs text-red-600">{error}</p>
                )}
                {helperText && !error && (
                    <p className="text-xs text-secondary-500">{helperText}</p>
                )}
            </div>
        )
    }
)

Textarea.displayName = 'Textarea'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: string
    helperText?: string
    fullWidth?: boolean
    options: Array<{ value: string; label: string }>
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    (
        {
            className,
            label,
            error,
            helperText,
            fullWidth = false,
            options,
            id,
            ...props
        },
        ref
    ) => {
        const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

        return (
            <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
                {label && (
                    <label
                        htmlFor={selectId}
                        className="text-sm font-medium text-gray-900"
                    >
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    id={selectId}
                    className={cn(
                        'w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm transition-colors',
                        'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-secondary-50',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                        className
                    )}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <p className="text-xs text-red-600">{error}</p>
                )}
                {helperText && !error && (
                    <p className="text-xs text-secondary-500">{helperText}</p>
                )}
            </div>
        )
    }
)

Select.displayName = 'Select'
