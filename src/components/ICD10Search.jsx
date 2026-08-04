// =============================================================
// FILE: ICD10Search.jsx
// PURPOSE: React component / entry point for the eDoc Hospital
//          frontend. Part of the Vite + React SPA.
// =============================================================
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, AlertCircle } from 'lucide-react';
import { searchIcd10 } from '../lib/api';

const ICD10Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // API search
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const { data, error } = await searchIcd10(searchTerm);
        if (error) {
          console.error('Failed to fetch ICD-10 codes', error.message);
          return;
        }

        const mappedResults = data?.map(item => ({
          code: item.code,
          description: item.name
        })) || [];
        setSearchResults(mappedResults);
        setShowDropdown(true);
      } catch (error) {
        console.error('Error fetching ICD-10 codes:', error);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce the fetch
    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelect = (diagnosis) => {
    if (!selectedDiagnoses.find(d => d.code === diagnosis.code)) {
      setSelectedDiagnoses([...selectedDiagnoses, diagnosis]);
    }
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleRemove = (codeToRemove) => {
    setSelectedDiagnoses(selectedDiagnoses.filter(d => d.code !== codeToRemove));
  };

  return (
    <div className="p-8 max-w-3xl mx-auto bg-white min-h-screen">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Clinical Diagnosis Module</h1>
        <p className="text-gray-500">ICD-10 Integration Prototype</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <ActivityIcon className="w-5 h-5 mr-2 text-teal-600" />
          Add Primary/Secondary Diagnoses
        </h2>

        {/* Selected Diagnoses */}
        {selectedDiagnoses.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Selected Diagnoses:</h3>
            <div className="space-y-3">
              {selectedDiagnoses.map((diag, index) => (
                <div key={diag.code} className="flex items-center justify-between p-3 bg-teal-50 border border-teal-100 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-teal-100 text-teal-800 font-bold px-2 py-1 rounded text-sm mr-3">
                      {diag.code}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{diag.description}</p>
                      <p className="text-xs text-teal-600">{index === 0 ? 'Primary Diagnosis' : 'Secondary Diagnosis'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemove(diag.code)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm transition-shadow"
              placeholder="Search diagnosis by ICD-10 code (e.g. 'J18') or name (e.g. 'Pneumonia')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-500 border-t-transparent"></div>
              </div>
            )}
          </div>

          {/* Dropdown Results */}
          {showDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto sm:text-sm">
              {searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <button
                    key={result.code}
                    onClick={() => handleSelect(result)}
                    className="w-full text-left cursor-default select-none relative py-3 pl-3 pr-9 hover:bg-gray-50 flex items-start border-b border-gray-50 last:border-0"
                  >
                    <div className="w-16 flex-shrink-0 text-sm font-bold text-teal-600">
                      {result.code}
                    </div>
                    <div className="flex-auto ml-2">
                      <span className="block truncate font-medium text-gray-900">
                        {result.description}
                      </span>
                    </div>
                    <div className="flex-shrink-0 flex items-center">
                      <Plus className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="cursor-default select-none relative py-4 px-4 text-gray-500 text-center">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p>No ICD-10 codes found matching "{searchTerm}".</p>
                  <p className="text-xs mt-1">Try standard medical terms instead of abbreviations.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Benefits Box */}
        <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-800">Why use ICD-10?</h4>
            <ul className="mt-2 text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Ensures accurate billing and insurance claims.</li>
              <li>Standardizes medical records across all doctors.</li>
              <li>Enables automated disease reporting (e.g. Malaria, Cholera counts).</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

// Helper Icon
function ActivityIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    </svg>
  )
}

export default ICD10Search;
