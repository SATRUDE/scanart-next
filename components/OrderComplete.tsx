'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderCompleteProps {
  onContinueShopping?: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
  iconColor?: string;
  iconBgColor?: string;
}

export const OrderComplete: React.FC<OrderCompleteProps> = ({
  onContinueShopping,
  title = "Order Complete!",
  message = "Thank you for your purchase.",
  buttonText = "Continue Shopping",
  iconColor = "text-green-600",
  iconBgColor = "bg-green-100"
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className={`w-16 h-16 ${iconBgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <Shield className={`h-8 w-8 ${iconColor}`} />
        </div>
        <h2 className="text-2xl mb-4">{title}</h2>
        <p className="text-muted-foreground mb-6">
          {message}
        </p>
        {onContinueShopping && (
          <Button onClick={onContinueShopping}>{buttonText}</Button>
        )}
      </div>
    </div>
  );
}; 