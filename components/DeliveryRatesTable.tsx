'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllShippingRates } from '@/config/shipping';

// Delivery costs shown in the visitor's selected currency (same picker and
// formatter the product prices use), rather than a fixed currency.
export const DeliveryRatesTable: React.FC = () => {
  const { formatPrice } = useLanguage();
  const rates = getAllShippingRates();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 pr-4 font-medium text-neutral-900">Destination</th>
            <th className="py-2 pr-4 font-medium text-neutral-900">Cost</th>
            <th className="py-2 font-medium text-neutral-900">Estimated delivery</th>
          </tr>
        </thead>
        <tbody>
          {rates.map(rate => (
            <tr key={rate.countryCode} className="border-b border-border">
              <td className="py-2 pr-4">{rate.countryName}</td>
              <td className="py-2 pr-4">{formatPrice(rate.costs)}</td>
              <td className="py-2">{rate.estimatedDays}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
