'use client';

import React from 'react';
import Link from 'next/link';
import { ResponsiveText } from '@/components/ResponsiveText';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-100 py-16">
      <div className="container mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 mb-16">
          <div className="lg:col-span-2">
            <p className="text-2xl text-neutral-900 leading-relaxed">
              A Scandinavian art gallery, where we curate an exquisite selection of artworks.
            </p>
          </div>
          <div className="lg:col-start-4">
            <ul className="text-sm text-neutral-900 space-y-2">
              <li><Link href="/about" className="hover:text-neutral-600 transition-colors">About</Link></li>
              <li><Link href="/journal" className="hover:text-neutral-600 transition-colors">Journal</Link></li>
              <li><Link href="/artists" className="hover:text-neutral-600 transition-colors">Artists</Link></li>
              <li><Link href="/help" className="hover:text-neutral-600 transition-colors">Help</Link></li>
              <li><button disabled className="text-neutral-400 cursor-not-allowed opacity-50">Newsletter</button></li>
              <li><Link href="/products" className="hover:text-neutral-600 transition-colors">Shop All</Link></li>
            </ul>
          </div>
          <div>
            <ul className="text-sm text-neutral-900 space-y-2">
              <li><a href="mailto:hello@scandinavianart.co.uk" className="hover:text-neutral-600 transition-colors">Send Email</a></li>
              <li><a href="https://www.instagram.com/helloscandinavianart/" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-600 transition-colors">Instagram</a></li>
              <li><a href="https://www.facebook.com/people/Scandinavian-Art/61563171855842/" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-600 transition-colors">Facebook</a></li>
            </ul>
          </div>
          <div>
            <ul className="text-sm text-neutral-900 space-y-2">
              <li><Link href="/privacy" className="hover:text-neutral-600 transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-neutral-600 transition-colors">Terms</Link></li>
              <li><Link href="/delivery" className="hover:text-neutral-600 transition-colors">Delivery</Link></li>
            </ul>
          </div>
        </div>
        <div className="mb-16">
          <ResponsiveText text="SCANDINAVIAN ART" />
        </div>
        <div>
          <p className="text-sm text-neutral-900">Copyright &copy; 2025 SCANDINAVIAN ART</p>
        </div>
      </div>
    </footer>
  );
};
