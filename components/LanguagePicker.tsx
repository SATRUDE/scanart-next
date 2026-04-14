'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { useLanguage, countries } from '@/contexts/LanguageContext';

export const LanguagePicker: React.FC = () => {
  const { selectedCountry, setSelectedCountry } = useLanguage();

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
    }
  };

  return (
    <div className="flex items-center">
      <Select value={selectedCountry.code} onValueChange={handleCountryChange}>
        <SelectTrigger className="w-auto border-none bg-transparent hover:bg-muted/50 focus:ring-0 focus:ring-offset-0" data-language="true">
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span className="text-sm">{selectedCountry.language}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <div className="flex items-center space-x-2">
                <span>{country.language}</span>
                <span className="text-muted-foreground">({country.currency})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
