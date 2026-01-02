// src/components/ui/LoadingSpinner.jsx
export default function LoadingSpinner({ size = 'md', className = '' }) {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4',
        xl: 'w-16 h-16 border-4',
    };

    return (
        <div className={`inline-block ${sizeClasses[size]} border-indigo-600 border-t-transparent rounded-full animate-spin ${className}`}></div>
    );
}
