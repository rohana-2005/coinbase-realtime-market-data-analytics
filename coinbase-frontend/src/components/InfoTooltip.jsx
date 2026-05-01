import React from 'react';

/**
 * InfoTooltip — small info icon that reveals a one-liner explanation on hover.
 * Uses pure CSS (no JS state), so it's lightweight and flicker-free.
 */
const InfoTooltip = ({ text, position = 'top' }) => (
  <span className="tooltip-container ml-1.5 cursor-help">
    <svg
      viewBox="0 0 16 16"
      className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 transition-colors"
      fill="currentColor"
    >
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zM8 5a.75.75 0 1 0 0-1.5A.75.75 0 0 0 8 5zm-.75 1.5h1.5v4.5h-1.5V6.5z"/>
    </svg>
    <span className="tooltip-box">{text}</span>
  </span>
);

export default InfoTooltip;
