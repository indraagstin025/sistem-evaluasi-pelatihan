'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileEdit, 
  BarChart2, 
  PieChart 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Daftar Peserta', href: '/peserta', icon: Users },
    { name: 'Input Nilai', href: '/input-nilai', icon: FileEdit },
    { name: 'Perbandingan', href: '/perbandingan', icon: BarChart2 },
    { name: 'Ekspose', href: '/ekspose', icon: PieChart },
  ];

  return (
    <aside className="w-[240px] bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 min-h-screen sticky top-0 h-screen overflow-hidden select-none">
      <div className="p-5">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          {/* Logo BPSDM (Emerald Green Leaf / Ribbon) */}
          <div className="relative w-8 h-8 shrink-0">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
              <path
                d="M4 18C4 8 12 2 22 2C32 2 32 12 24 20C16 28 8 24 4 18Z"
                fill="#10B981"
              />
              <path
                d="M4 22C8 12 20 10 26 16C32 22 24 30 14 30C6 30 2 26 4 22Z"
                fill="#059669"
                opacity="0.9"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-gray-900 tracking-tight leading-tight">BPSDM</h1>
            <p className="text-[10px] text-gray-500 leading-tight">Pengembangan SDM<br />untuk Indonesia</p>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-gray-100 my-4" />

        {/* Navigation List */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500 text-white font-semibold shadow-sm shadow-emerald-500/25'
                    : 'text-gray-700 hover:bg-gray-50 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Organic Waves & Footer Text */}
      <div className="relative pt-16">
        {/* Decorative Translucent Wave Illustration (Persis FigCraft) */}
        <div className="absolute inset-x-0 bottom-0 h-44 pointer-events-none overflow-hidden">
          <svg
            viewBox="0 0 240 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full object-cover"
            preserveAspectRatio="none"
          >
            {/* Wave 1: Soft Mint */}
            <path
              d="M0 90C60 60 140 130 240 80V180H0V90Z"
              fill="#ECFDF5"
              fillOpacity="0.8"
            />
            {/* Wave 2: Emerald Tint */}
            <path
              d="M0 110C80 70 160 130 240 90V180H0V110Z"
              fill="#D1FAE5"
              fillOpacity="0.5"
            />
            {/* Wave Accent Line 1 */}
            <path
              d="M0 100C70 50 150 120 240 70"
              stroke="#6EE7B7"
              strokeWidth="2"
              fill="none"
              strokeOpacity="0.7"
            />
            {/* Wave Accent Line 2 */}
            <path
              d="M0 130C90 70 150 140 240 95"
              stroke="#A7F3D0"
              strokeWidth="1.5"
              fill="none"
              strokeOpacity="0.8"
            />
          </svg>
        </div>

        {/* Footer Text */}
        <div className="relative p-5 z-10">
          <p className="text-xs text-gray-700 font-medium">Sistem Evaluasi</p>
          <p className="text-xs text-gray-700 font-medium">Pasca Pelatihan</p>
          <p className="text-[11px] text-gray-400 mt-1 font-normal">v1.0</p>
        </div>
      </div>
    </aside>
  );
}
