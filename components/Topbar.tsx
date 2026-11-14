'use client';

import React from 'react';

interface TopbarProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

export default function Topbar({ title, subtitle, children }: TopbarProps) {
  return (
    <header className="mb-7 flex flex-col justify-between gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-[28px]">
          {title}
        </h1>
        <p className="mt-1 text-sm font-normal text-zinc-600">
          {subtitle}
        </p>
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-2.5">
          {children}
        </div>
      )}
    </header>
  );
}
