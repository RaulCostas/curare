import React, { useState, useRef, useEffect } from 'react';

export interface Option {
    id: number | string;
    label: string;
    subLabel?: string;
    searchString?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: number | string;
    onChange: (id: number | string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
    icon?: React.ReactNode;
    /** Called when internal search term changes - use for backend-driven filtering */
    onSearchChange?: (term: string) => void;
    /** Show spinner while results are loading */
    loading?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = '-- Seleccione una opción --',
    searchPlaceholder = 'Buscar por Nombre, Apellido o CI...',
    className = '',
    disabled = false,
    required = false,
    icon,
    onSearchChange,
    loading = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => String(opt.id) === String(value));

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const normalizedSearch = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // If onSearchChange is provided, skip local filtering (backend does it)
    const filteredOptions = onSearchChange
        ? options
        : options.filter(opt => {
            const labelNorm = opt.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const subLabelNorm = opt.subLabel ? opt.subLabel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
            const searchStrNorm = opt.searchString ? opt.searchString.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

            return labelNorm.includes(normalizedSearch) ||
                   subLabelNorm.includes(normalizedSearch) ||
                   searchStrNorm.includes(normalizedSearch);
        }).sort((a, b) => {
            if (!normalizedSearch) return 0;
            const searchTrimmed = normalizedSearch.trim();
            if (!searchTrimmed) return 0;
            
            const getScore = (opt: Option) => {
                const label = opt.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                const searchStr = opt.searchString ? opt.searchString.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";
                
                // 1. Exact start match on label or searchString (e.g. Last Name matches)
                if (label.startsWith(searchTrimmed)) return 100;
                if (searchStr.startsWith(searchTrimmed)) return 90;
                
                // 2. Starts with word in the middle (e.g. First Name matches)
                const wordsLabel = label.split(' ');
                const wordsSearch = searchStr.split(' ');
                
                if (wordsLabel.some(w => w.startsWith(searchTrimmed))) return 50;
                if (wordsSearch.some(w => w.startsWith(searchTrimmed))) return 40;
                
                // 3. Contains somewhere
                if (label.includes(searchTrimmed)) return 10;
                if (searchStr.includes(searchTrimmed)) return 5;
                
                return 0;
            };

            const scoreA = getScore(a);
            const scoreB = getScore(b);
            
            if (scoreA !== scoreB) {
                return scoreB - scoreA;
            }

            return 0;
        });

    const handleSelect = (id: number | string) => {
        onChange(id);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div
                className={`flex items-center w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60' : 'hover:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500'}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                {icon && <span className="mr-2 text-gray-400">{icon}</span>}
                <div className="flex-1 truncate">
                    {selectedOption ? selectedOption.label : <span className="text-gray-400">{placeholder}</span>}
                </div>
                <svg
                    className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <div className="absolute w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-xl overflow-hidden" style={{ zIndex: 9999 }}>
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="relative">
                            <input
                                ref={inputRef}
                                autoFocus
                                type="text"
                                className="w-full px-3 py-1.5 pr-8 text-sm rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:outline-none focus:ring-blue-500 dark:text-white"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    if (onSearchChange) onSearchChange(e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                            {loading && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                    <div className="h-3.5 w-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>
                    <ul className="max-h-60 overflow-y-auto py-1">
                        {loading && filteredOptions.length === 0 ? (
                            <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic">Buscando...</li>
                        ) : filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <li
                                    key={opt.id}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors ${String(value) === String(opt.id) ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelect(opt.id);
                                    }}
                                >
                                    <div>{opt.label}</div>
                                    {opt.subLabel && <div className="text-xs text-gray-500 dark:text-gray-400">{opt.subLabel}</div>}
                                </li>
                            ))
                        ) : (
                            <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic">No se encontraron resultados</li>
                        )}
                    </ul>
                </div>
            )}
            
            {required && <input type="hidden" value={value || ''} required />}
        </div>
    );
};

export default SearchableSelect;
