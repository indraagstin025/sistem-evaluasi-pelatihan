import React from 'react';

interface IconProps {
  className?: string;
}

/**
 * Ikon printer monokrom pada grid 15x15 agar selaras dengan @radix-ui/react-icons.
 */
export function PrinterIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 1.5H11V5H4V1.5ZM3 5C2.17157 5 1.5 5.67157 1.5 6.5V10.5C1.5 11.0523 1.94772 11.5 2.5 11.5H4V13.5H11V11.5H12.5C13.0523 11.5 13.5 11.0523 13.5 10.5V6.5C13.5 5.67157 12.8284 5 12 5H3ZM4 8.5H11V12.5H4V8.5Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
