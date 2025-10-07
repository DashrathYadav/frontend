import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './Select';

type Language = 'en' | 'hi';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
];

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, changeLanguage } = useLanguage();

  const handleLanguageChange = (value: Language) => {
    changeLanguage(value);
  };

  const currentLanguageLabel = languages.find(lang => lang.code === currentLanguage)?.nativeName || 'English';

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-gray-600" />
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[130px] h-9">
          <SelectValue placeholder={currentLanguageLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.nativeName}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
