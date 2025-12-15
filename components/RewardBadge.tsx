import React from 'react';

export const RewardBadge = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldGradient" x1="10%" y1="10%" x2="90%" y2="90%">
        <stop offset="0%" stopColor="#fcd34d" /> {/* Amber 300 */}
        <stop offset="50%" stopColor="#f59e0b" /> {/* Amber 500 */}
        <stop offset="100%" stopColor="#b45309" /> {/* Amber 700 */}
      </linearGradient>
      <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.3)"/>
      </filter>
    </defs>
    
    {/* Drop Shadow Group */}
    <g filter="url(#badgeShadow)">
        {/* Thick Dark Outline */}
        <circle cx="50" cy="50" r="48" fill="#451a03" />
        
        {/* Main Gold Body */}
        <circle cx="50" cy="50" r="44" fill="url(#goldGradient)" />
        
        {/* Inner Rim Highlight */}
        <circle cx="50" cy="50" r="40" fill="none" stroke="#fbbf24" strokeWidth="2" strokeOpacity="0.5" />
    </g>

    {/* Glossy Shine (Cartoon style) */}
    <ellipse cx="50" cy="25" rx="25" ry="12" fill="white" fillOpacity="0.3" />
    
    {/* Star in Center */}
    <path 
      d="M50 22 L59 40 L79 40 L63 52 L69 71 L50 61 L31 71 L37 52 L21 40 L41 40 Z" 
      fill="#fffbeb" 
      stroke="#b45309" 
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);
