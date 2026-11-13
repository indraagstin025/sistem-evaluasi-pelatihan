'use client';

import { Calendar, ChevronDown } from 'lucide-react';
import React from 'react';

interface TopbarProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

export default function Topbar({ title, subtitle, children }: TopbarProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight leading-tight">
          {title}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {children}

        {/* Dropdown Dataset Selector (Persis FigCraft) */}
        <div className="flex items-center gap-2.5 bg-white border border-gray-200 px-3.5 py-2 rounded-xl shadow-xs text-xs font-medium text-gray-800 cursor-pointer hover:border-gray-300 transition-colors">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>Data PKP - 2026</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 ml-0.5 inline-block" />
        </div>
      </div>
    </header>
  );
}
