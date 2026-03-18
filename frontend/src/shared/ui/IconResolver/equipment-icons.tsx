/**
 * Custom Kitchen Equipment SVG Icons
 *
 * Bold, filled silhouette icons representing actual kitchen/restaurant machines.
 * Each icon is a React component accepting { size, className, color } props.
 * Designed on a 24×24 viewBox for consistency.
 */

import React from 'react';

export interface EquipmentIconProps extends React.SVGAttributes<SVGElement> {
  size?: number | string;
  color?: string;
}

/* ═══════════════════════════════════════════════════════════
   1. ESPRESSO MACHINE  (ماكينات القهوة / coffee)
   ═══════════════════════════════════════════════════════════ */
export const EspressoMachineIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Main body */}
    <rect x="4" y="2" width="16" height="15" rx="2" />
    {/* Display panel cutout */}
    <rect x="6" y="4" width="12" height="3" rx="0.5" fill="white" opacity="0.2" />
    {/* Gauge */}
    <circle cx="12" cy="5.5" r="1" fill="white" opacity="0.3" />
    {/* Group head / drip area */}
    <rect x="8" y="12" width="8" height="4" rx="0.5" fill="white" opacity="0.15" />
    {/* Portafilter */}
    <path d="M9 17h6v1.5a1 1 0 01-1 1h-4a1 1 0 01-1-1V17z" />
    {/* Portafilter handle */}
    <rect x="7" y="17.5" width="2.5" height="1" rx="0.5" />
    {/* Drip tray */}
    <rect x="6" y="20" width="12" height="2" rx="1" />
    {/* Steam wand */}
    <path d="M18.5 10v7" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
    <circle cx="18.5" cy="17.5" r="0.8" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   2. COFFEE GRINDER  (مطاحن القهوة / cog)
   ═══════════════════════════════════════════════════════════ */
export const CoffeeGrinderIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Hopper */}
    <path d="M7 2h10l-2 6H9L7 2z" />
    {/* Body */}
    <rect x="6" y="8" width="12" height="10" rx="2" />
    {/* Grind adjustment dial */}
    <circle cx="12" cy="13" r="2.5" fill="white" opacity="0.2" />
    <circle cx="12" cy="13" r="1" fill="white" opacity="0.3" />
    {/* Dispenser fork */}
    <rect x="8" y="18" width="8" height="1.5" rx="0.5" />
    {/* Portafilter holder */}
    <path d="M9 19.5h6v1a1 1 0 01-1 1h-4a1 1 0 01-1-1v-1z" />
    {/* Base */}
    <rect x="5" y="21" width="14" height="2" rx="1" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   3. COMMERCIAL BLENDER  (محضرات المشروبات / blend)
   ═══════════════════════════════════════════════════════════ */
export const CommercialBlenderIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Lid */}
    <rect x="9" y="1" width="6" height="2" rx="1" />
    {/* Jar */}
    <path d="M8 3h8l1 12H7L8 3z" />
    {/* Jar measurement lines */}
    <line x1="8.5" y1="6" x2="10" y2="6" stroke="white" strokeWidth="0.5" opacity="0.3" />
    <line x1="8.2" y1="9" x2="10" y2="9" stroke="white" strokeWidth="0.5" opacity="0.3" />
    <line x1="7.8" y1="12" x2="10" y2="12" stroke="white" strokeWidth="0.5" opacity="0.3" />
    {/* Handle */}
    <path d="M16 5h2a1 1 0 011 1v6a1 1 0 01-1 1h-1.5" fill="none" stroke={color} strokeWidth="1.5" />
    {/* Motor base */}
    <rect x="5" y="15" width="14" height="7" rx="2" />
    {/* Control knob */}
    <circle cx="12" cy="18.5" r="2" fill="white" opacity="0.2" />
    <circle cx="12" cy="18.5" r="0.8" fill="white" opacity="0.3" />
    {/* Base pad */}
    <rect x="6" y="21" width="12" height="1" rx="0.5" fill="white" opacity="0.1" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   4. STAND MIXER / PLANETARY MIXER  (العجانات / disc3)
   ═══════════════════════════════════════════════════════════ */
export const StandMixerIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Motor head */}
    <path d="M13 2h6a2 2 0 012 2v5a2 2 0 01-2 2h-3L13 2z" />
    {/* Speed dial */}
    <circle cx="17" cy="5.5" r="1.5" fill="white" opacity="0.2" />
    {/* Arm/neck */}
    <rect x="13" y="8" width="3" height="4" rx="0.5" />
    {/* Beater/whisk */}
    <path d="M13.5 12v3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <ellipse cx="13.5" cy="15.5" rx="1.2" ry="2" fill="white" opacity="0.2" />
    {/* Bowl */}
    <path d="M5 13h13v1a7 7 0 01-7 7h0a7 7 0 01-7-7v-1h1z" />
    {/* Bowl rim highlight */}
    <path d="M5 13h13" stroke="white" strokeWidth="0.5" opacity="0.2" />
    {/* Stand/pillar */}
    <rect x="18" y="9" width="2" height="12" rx="1" />
    {/* Base */}
    <rect x="3" y="20" width="19" height="2.5" rx="1" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   5. COMMERCIAL OVEN  (الأفران / أفران المطاعم)
   ═══════════════════════════════════════════════════════════ */
export const CommercialOvenIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Chimney/vent */}
    <rect x="10" y="0.5" width="4" height="2" rx="0.5" />
    {/* Main body */}
    <rect x="3" y="2.5" width="18" height="18" rx="2" />
    {/* Control panel top */}
    <rect x="5" y="4" width="14" height="3" rx="0.5" fill="white" opacity="0.15" />
    {/* Control knobs */}
    <circle cx="7.5" cy="5.5" r="0.8" fill="white" opacity="0.3" />
    <circle cx="10.5" cy="5.5" r="0.8" fill="white" opacity="0.3" />
    <circle cx="13.5" cy="5.5" r="0.8" fill="white" opacity="0.3" />
    <circle cx="16.5" cy="5.5" r="0.8" fill="white" opacity="0.3" />
    {/* Oven door / window */}
    <rect x="5" y="8" width="14" height="10" rx="1" fill="white" opacity="0.15" />
    {/* Door handle */}
    <rect x="6" y="8.5" width="12" height="1.2" rx="0.6" fill="white" opacity="0.2" />
    {/* Interior shelves */}
    <line x1="6" y1="12" x2="18" y2="12" stroke="white" strokeWidth="0.4" opacity="0.2" />
    <line x1="6" y1="15" x2="18" y2="15" stroke="white" strokeWidth="0.4" opacity="0.2" />
    {/* Feet */}
    <rect x="4" y="20.5" width="3" height="2" rx="0.5" />
    <rect x="17" y="20.5" width="3" height="2" rx="0.5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   6. DISPLAY REFRIGERATOR  (ثلاجات العرض / refrigerator)
   ═══════════════════════════════════════════════════════════ */
export const DisplayFridgeIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Main body */}
    <rect x="4" y="1" width="16" height="20" rx="2" />
    {/* Glass door */}
    <rect x="6" y="3" width="12" height="16" rx="1" fill="white" opacity="0.15" />
    {/* Shelves */}
    <line x1="6" y1="7" x2="18" y2="7" stroke="white" strokeWidth="0.5" opacity="0.3" />
    <line x1="6" y1="11" x2="18" y2="11" stroke="white" strokeWidth="0.5" opacity="0.3" />
    <line x1="6" y1="15" x2="18" y2="15" stroke="white" strokeWidth="0.5" opacity="0.3" />
    {/* Handle */}
    <rect x="17" y="7" width="1.2" height="6" rx="0.6" fill="white" opacity="0.3" />
    {/* Feet */}
    <rect x="5" y="21" width="2" height="2" rx="0.5" />
    <rect x="17" y="21" width="2" height="2" rx="0.5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   7. UPRIGHT STORAGE FRIDGE  (ثلاجات التخزين / warehouse)
   ═══════════════════════════════════════════════════════════ */
export const UprightFridgeIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Main body */}
    <rect x="4" y="1" width="16" height="20" rx="2" />
    {/* Top door */}
    <rect x="5" y="2" width="14" height="8" rx="1" fill="white" opacity="0.1" />
    {/* Bottom door */}
    <rect x="5" y="11" width="14" height="9" rx="1" fill="white" opacity="0.08" />
    {/* Door line */}
    <line x1="5" y1="10.5" x2="19" y2="10.5" stroke="white" strokeWidth="0.6" opacity="0.3" />
    {/* Top handle */}
    <rect x="17.5" y="4" width="1" height="4" rx="0.5" fill="white" opacity="0.3" />
    {/* Bottom handle */}
    <rect x="17.5" y="13" width="1" height="4" rx="0.5" fill="white" opacity="0.3" />
    {/* Feet */}
    <rect x="5" y="21" width="2" height="2" rx="0.5" />
    <rect x="17" y="21" width="2" height="2" rx="0.5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   8. PREP COUNTER FRIDGE  (ثلاجات التحضير / snowflake)
   ═══════════════════════════════════════════════════════════ */
export const PrepCounterFridgeIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Worktop surface */}
    <rect x="2" y="6" width="20" height="2" rx="0.5" />
    {/* Body */}
    <rect x="3" y="8" width="18" height="12" rx="1.5" />
    {/* Left door */}
    <rect x="4.5" y="9.5" width="7" height="9" rx="0.5" fill="white" opacity="0.1" />
    {/* Right door */}
    <rect x="12.5" y="9.5" width="7" height="9" rx="0.5" fill="white" opacity="0.1" />
    {/* Door line */}
    <line x1="12" y1="9" x2="12" y2="19" stroke="white" strokeWidth="0.4" opacity="0.3" />
    {/* Handles */}
    <rect x="10.5" y="12" width="0.8" height="3" rx="0.4" fill="white" opacity="0.3" />
    <rect x="12.8" y="12" width="0.8" height="3" rx="0.4" fill="white" opacity="0.3" />
    {/* Feet */}
    <rect x="4" y="20" width="2" height="2.5" rx="0.5" />
    <rect x="18" y="20" width="2" height="2.5" rx="0.5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   9. ICE CREAM DISPLAY  (ثلاجات عرض البوظة / ice-cream-cone)
   ═══════════════════════════════════════════════════════════ */
export const IceCreamDisplayIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Curved glass top */}
    <path d="M3 8c0-4 4-6 9-6s9 2 9 6v2H3V8z" />
    {/* Glass panel */}
    <path d="M4 4c0-2 3-3.5 8-3.5S20 2 20 4" fill="white" opacity="0.15" />
    {/* Cabinet body */}
    <rect x="3" y="10" width="18" height="10" rx="1.5" />
    {/* Display pans */}
    <rect x="5" y="8" width="3.5" height="2.5" rx="0.5" fill="white" opacity="0.2" />
    <rect x="10" y="8" width="3.5" height="2.5" rx="0.5" fill="white" opacity="0.2" />
    <rect x="15" y="8" width="3.5" height="2.5" rx="0.5" fill="white" opacity="0.2" />
    {/* Panel line */}
    <rect x="5" y="12" width="14" height="5" rx="0.5" fill="white" opacity="0.08" />
    {/* Wheels */}
    <circle cx="6" cy="21.5" r="1.5" />
    <circle cx="18" cy="21.5" r="1.5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   10. DISHWASHER  (معدات الجلي / sparkles)
   ═══════════════════════════════════════════════════════════ */
export const DishwasherIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Hood (raised) */}
    <path d="M3 3h18a2 2 0 012 2v3l-2 2H3L1 8V5a2 2 0 012-2z" />
    {/* Hood handle */}
    <rect x="8" y="4" width="8" height="1" rx="0.5" fill="white" opacity="0.3" />
    {/* Main body */}
    <rect x="3" y="9" width="18" height="11" rx="1.5" />
    {/* Control panel */}
    <rect x="5" y="10.5" width="14" height="3" rx="0.5" fill="white" opacity="0.12" />
    {/* Control buttons */}
    <circle cx="8" cy="12" r="0.8" fill="white" opacity="0.3" />
    <circle cx="11" cy="12" r="0.8" fill="white" opacity="0.3" />
    <circle cx="14" cy="12" r="0.8" fill="white" opacity="0.3" />
    {/* Door panel */}
    <rect x="5" y="14.5" width="14" height="4" rx="0.5" fill="white" opacity="0.08" />
    {/* Feet */}
    <rect x="4" y="20" width="3" height="2.5" rx="0.5" />
    <rect x="17" y="20" width="3" height="2.5" rx="0.5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   11. MEAT SLICER  (آلات تشريح لحوم / slice)
   ═══════════════════════════════════════════════════════════ */
export const MeatSlicerIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Blade */}
    <circle cx="9" cy="10" r="7" />
    <circle cx="9" cy="10" r="2" fill="white" opacity="0.3" />
    {/* Blade guard highlight */}
    <path d="M9 3.5a6.5 6.5 0 016.5 6.5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2" />
    {/* Carriage plate */}
    <path d="M15 5h5a1 1 0 011 1v12a1 1 0 01-1 1h-5V5z" />
    {/* Carriage fence */}
    <rect x="18" y="6" width="2" height="12" rx="0.5" fill="white" opacity="0.1" />
    {/* Food platform guide */}
    <rect x="15" y="13" width="6" height="1.5" rx="0.5" fill="white" opacity="0.15" />
    {/* Base */}
    <rect x="2" y="18" width="20" height="3" rx="1.5" />
    {/* Thickness knob */}
    <circle cx="5" cy="19.5" r="1" fill="white" opacity="0.2" />
    {/* Feet */}
    <rect x="3" y="21" width="3" height="1.5" rx="0.5" />
    <rect x="18" y="21" width="3" height="1.5" rx="0.5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   12. MEAT GRINDER  (الات فرم لحمة / drumstick)
   ═══════════════════════════════════════════════════════════ */
export const MeatGrinderIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Feed tray / hopper */}
    <path d="M6 2h8l1 3H5L6 2z" />
    {/* Feed tube */}
    <rect x="7" y="5" width="6" height="3" rx="0.5" />
    {/* Motor body */}
    <rect x="3" y="8" width="14" height="10" rx="3" />
    {/* Motor panel */}
    <rect x="5" y="10" width="10" height="6" rx="1" fill="white" opacity="0.1" />
    {/* On/off buttons */}
    <circle cx="8" cy="13" r="1" fill="white" opacity="0.25" />
    <circle cx="12" cy="13" r="1" fill="white" opacity="0.2" />
    {/* Output tube / nozzle */}
    <path d="M17 11h4a1 1 0 011 1v2a1 1 0 01-1 1h-4" />
    {/* Output plate (die) */}
    <circle cx="21.5" cy="13" r="1.5" fill="white" opacity="0.15" />
    {/* Base */}
    <rect x="2" y="18" width="16" height="3" rx="1.5" />
    {/* Feet */}
    <rect x="3" y="21" width="3" height="1.5" rx="0.5" />
    <rect x="13" y="21" width="3" height="1.5" rx="0.5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   13. SHAWARMA MACHINE  (آلات الشورما / معدات الشورما)
   ═══════════════════════════════════════════════════════════ */
export const ShawarmaMachineIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Top cap / motor housing */}
    <path d="M9 1h6a1 1 0 011 1v2H8V2a1 1 0 011-1z" />
    {/* Vertical spit/skewer */}
    <rect x="11" y="3" width="2" height="15" rx="0.5" />
    {/* Meat on spit */}
    <ellipse cx="12" cy="10" rx="4" ry="7" fill="white" opacity="0.15" />
    <path d="M8.5 5c0 0-1 3-1 5s1 5 1 5h7c0 0 1-3 1-5s-1-5-1-5H8.5z" opacity="0.85" />
    {/* Heat burners (left side) */}
    <rect x="3" y="4" width="4" height="14" rx="1" opacity="0.7" />
    <line x1="4.5" y1="6" x2="4.5" y2="7" stroke="white" strokeWidth="0.6" opacity="0.3" />
    <line x1="4.5" y1="9" x2="4.5" y2="10" stroke="white" strokeWidth="0.6" opacity="0.3" />
    <line x1="4.5" y1="12" x2="4.5" y2="13" stroke="white" strokeWidth="0.6" opacity="0.3" />
    <line x1="4.5" y1="15" x2="4.5" y2="16" stroke="white" strokeWidth="0.6" opacity="0.3" />
    {/* Base plate / drip tray */}
    <rect x="3" y="18" width="18" height="2" rx="1" />
    {/* Drip pan */}
    <path d="M7 20h10v2a1 1 0 01-1 1H8a1 1 0 01-1-1v-2z" opacity="0.8" />
    {/* Adjustable arm */}
    <path d="M16 10h3v2h-3z" rx="0.5" opacity="0.6" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   14. COMMERCIAL GRILL / GRIDDLE  (جريلات)
   ═══════════════════════════════════════════════════════════ */
export const CommercialGrillIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Cooking surface */}
    <rect x="2" y="5" width="20" height="3" rx="1" />
    {/* Grill lines */}
    <line x1="5" y1="6" x2="19" y2="6" stroke="white" strokeWidth="0.4" opacity="0.3" />
    <line x1="5" y1="7" x2="19" y2="7" stroke="white" strokeWidth="0.4" opacity="0.3" />
    {/* Back splash */}
    <rect x="2" y="2" width="20" height="3" rx="1" opacity="0.8" />
    {/* Control knobs */}
    <circle cx="6" cy="3.5" r="0.8" fill="white" opacity="0.3" />
    <circle cx="10" cy="3.5" r="0.8" fill="white" opacity="0.3" />
    <circle cx="14" cy="3.5" r="0.8" fill="white" opacity="0.3" />
    <circle cx="18" cy="3.5" r="0.8" fill="white" opacity="0.3" />
    {/* Body */}
    <rect x="2" y="8" width="20" height="10" rx="1.5" />
    {/* Front panel */}
    <rect x="4" y="10" width="16" height="6" rx="0.5" fill="white" opacity="0.08" />
    {/* Grease tray */}
    <rect x="8" y="16.5" width="8" height="1.5" rx="0.5" fill="white" opacity="0.12" />
    {/* Feet */}
    <rect x="3" y="18" width="3" height="4" rx="0.5" />
    <rect x="18" y="18" width="3" height="4" rx="0.5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   15. DOUGH SHEETER  (رقاقات العجين / circle-dot)
   ═══════════════════════════════════════════════════════════ */
export const DoughSheeterIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Frame / body */}
    <rect x="2" y="3" width="20" height="14" rx="2" />
    {/* Top roller */}
    <ellipse cx="8" cy="7" rx="3" ry="2.5" fill="white" opacity="0.2" />
    <circle cx="8" cy="7" r="0.8" fill="white" opacity="0.3" />
    {/* Bottom roller */}
    <ellipse cx="16" cy="7" rx="3" ry="2.5" fill="white" opacity="0.2" />
    <circle cx="16" cy="7" r="0.8" fill="white" opacity="0.3" />
    {/* Conveyor belt path */}
    <path d="M5 10h14" stroke="white" strokeWidth="0.5" opacity="0.3" />
    {/* Feed tray */}
    <path d="M3 13h18" stroke="white" strokeWidth="0.5" opacity="0.2" />
    {/* Control panel */}
    <rect x="8" y="14" width="8" height="2" rx="0.5" fill="white" opacity="0.1" />
    {/* Legs */}
    <rect x="3" y="17" width="3" height="5" rx="0.5" />
    <rect x="18" y="17" width="3" height="5" rx="0.5" />
    {/* Lower shelf */}
    <rect x="5" y="19" width="14" height="1" rx="0.3" opacity="0.7" />
    {/* Wheels */}
    <circle cx="4.5" cy="22.5" r="1" />
    <circle cx="19.5" cy="22.5" r="1" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   16. FOOD PROCESSOR  (محضرات الطعام / utensils)
   ═══════════════════════════════════════════════════════════ */
export const FoodProcessorIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Feed tube */}
    <rect x="14" y="1" width="4" height="5" rx="1" />
    <rect x="15" y="2" width="2" height="3" rx="0.5" fill="white" opacity="0.2" />
    {/* Lid */}
    <rect x="6" y="5" width="12" height="2" rx="1" />
    {/* Bowl */}
    <path d="M6 7h12v8a6 6 0 01-6 6h0a6 6 0 01-6-6V7z" />
    {/* Bowl transparent section */}
    <path d="M7.5 8h9v6a4.5 4.5 0 01-4.5 4.5h0a4.5 4.5 0 01-4.5-4.5V8z" fill="white" opacity="0.12" />
    {/* Blade */}
    <line x1="10" y1="11" x2="14" y2="13" stroke="white" strokeWidth="0.6" opacity="0.3" />
    <line x1="14" y1="11" x2="10" y2="13" stroke="white" strokeWidth="0.6" opacity="0.3" />
    {/* Motor base */}
    <rect x="5" y="19" width="14" height="3.5" rx="2" />
    {/* Base controls */}
    <circle cx="9" cy="20.8" r="0.8" fill="white" opacity="0.2" />
    <circle cx="12" cy="20.8" r="0.8" fill="white" opacity="0.2" />
    <circle cx="15" cy="20.8" r="0.8" fill="white" opacity="0.2" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   17. ICE MACHINE  (صانعة الثلج / droplets)
   ═══════════════════════════════════════════════════════════ */
export const IceMachineIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Main body */}
    <rect x="3" y="1" width="18" height="19" rx="2" />
    {/* Top section (ice maker) */}
    <rect x="5" y="3" width="14" height="7" rx="1" fill="white" opacity="0.12" />
    {/* Ice cubes pattern */}
    <rect x="6.5" y="4.5" width="2.5" height="2" rx="0.3" fill="white" opacity="0.2" />
    <rect x="10" y="4.5" width="2.5" height="2" rx="0.3" fill="white" opacity="0.2" />
    <rect x="13.5" y="4.5" width="2.5" height="2" rx="0.3" fill="white" opacity="0.2" />
    <rect x="6.5" y="7.5" width="2.5" height="2" rx="0.3" fill="white" opacity="0.15" />
    <rect x="10" y="7.5" width="2.5" height="2" rx="0.3" fill="white" opacity="0.15" />
    <rect x="13.5" y="7.5" width="2.5" height="2" rx="0.3" fill="white" opacity="0.15" />
    {/* Bottom bin door */}
    <rect x="5" y="11" width="14" height="7" rx="1" fill="white" opacity="0.08" />
    {/* Handle */}
    <rect x="10" y="14" width="4" height="1" rx="0.5" fill="white" opacity="0.25" />
    {/* Feet */}
    <rect x="4" y="20" width="3" height="2.5" rx="0.5" />
    <rect x="17" y="20" width="3" height="2.5" rx="0.5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   18. COOKING RANGE  (معدات مطاعم / chef-hat → cooking-range)
   ═══════════════════════════════════════════════════════════ */
export const CookingRangeIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Back splash */}
    <rect x="2" y="1" width="20" height="3" rx="1" />
    {/* Hob surface */}
    <rect x="2" y="4" width="20" height="5" rx="1" />
    {/* Burner rings */}
    <circle cx="7" cy="6.5" r="2" fill="none" stroke="white" strokeWidth="0.6" opacity="0.3" />
    <circle cx="7" cy="6.5" r="0.6" fill="white" opacity="0.3" />
    <circle cx="17" cy="6.5" r="2" fill="none" stroke="white" strokeWidth="0.6" opacity="0.3" />
    <circle cx="17" cy="6.5" r="0.6" fill="white" opacity="0.3" />
    {/* Control knobs */}
    <circle cx="6" cy="2.5" r="0.7" fill="white" opacity="0.3" />
    <circle cx="10" cy="2.5" r="0.7" fill="white" opacity="0.3" />
    <circle cx="14" cy="2.5" r="0.7" fill="white" opacity="0.3" />
    <circle cx="18" cy="2.5" r="0.7" fill="white" opacity="0.3" />
    {/* Oven body */}
    <rect x="2" y="9" width="20" height="11" rx="1.5" />
    {/* Oven door */}
    <rect x="4" y="10.5" width="16" height="8" rx="1" fill="white" opacity="0.1" />
    {/* Oven handle */}
    <rect x="7" y="11" width="10" height="1" rx="0.5" fill="white" opacity="0.25" />
    {/* Oven window */}
    <rect x="7" y="13" width="10" height="4" rx="0.5" fill="white" opacity="0.08" />
    {/* Feet */}
    <rect x="3" y="20" width="3" height="2.5" rx="0.5" />
    <rect x="18" y="20" width="3" height="2.5" rx="0.5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   19. DEEP FRYER / CHIPS CUTTER  (شبسرات / zap)
   ═══════════════════════════════════════════════════════════ */
export const DeepFryerIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Basket handles (raised) */}
    <path d="M7 2v3M12 1v4M17 2v3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    {/* Basket top bar */}
    <rect x="5" y="5" width="14" height="1.5" rx="0.5" />
    {/* Basket mesh */}
    <rect x="6" y="6.5" width="12" height="5" rx="0.5" fill="white" opacity="0.15" />
    <line x1="9" y1="6.5" x2="9" y2="11.5" stroke="white" strokeWidth="0.3" opacity="0.2" />
    <line x1="12" y1="6.5" x2="12" y2="11.5" stroke="white" strokeWidth="0.3" opacity="0.2" />
    <line x1="15" y1="6.5" x2="15" y2="11.5" stroke="white" strokeWidth="0.3" opacity="0.2" />
    {/* Oil well / tank */}
    <rect x="3" y="8" width="18" height="10" rx="2" />
    {/* Oil surface */}
    <rect x="5" y="9.5" width="14" height="6" rx="1" fill="white" opacity="0.08" />
    {/* Control panel */}
    <rect x="3" y="13" width="4" height="5" rx="0.5" opacity="0.85" />
    <circle cx="5" cy="15" r="0.7" fill="white" opacity="0.3" />
    <circle cx="5" cy="17" r="0.7" fill="white" opacity="0.3" />
    {/* Feet */}
    <rect x="4" y="18" width="3" height="4" rx="0.5" />
    <rect x="17" y="18" width="3" height="4" rx="0.5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   20. DOUGH PROOFER  (خمارات العجين / wheat)
   ═══════════════════════════════════════════════════════════ */
export const DoughProoferIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Main cabinet */}
    <rect x="3" y="1" width="18" height="19" rx="2" />
    {/* Door */}
    <rect x="5" y="3" width="14" height="15" rx="1" fill="white" opacity="0.1" />
    {/* Glass window */}
    <rect x="6" y="4" width="12" height="12" rx="0.5" fill="white" opacity="0.08" />
    {/* Tray racks (horizontal lines) */}
    <line x1="7" y1="6" x2="17" y2="6" stroke="white" strokeWidth="0.5" opacity="0.25" />
    <line x1="7" y1="8.5" x2="17" y2="8.5" stroke="white" strokeWidth="0.5" opacity="0.25" />
    <line x1="7" y1="11" x2="17" y2="11" stroke="white" strokeWidth="0.5" opacity="0.25" />
    <line x1="7" y1="13.5" x2="17" y2="13.5" stroke="white" strokeWidth="0.5" opacity="0.25" />
    {/* Handle */}
    <rect x="18" y="7" width="1" height="6" rx="0.5" fill="white" opacity="0.3" />
    {/* Control panel bottom */}
    <rect x="5" y="16.5" width="14" height="2" rx="0.5" fill="white" opacity="0.12" />
    <circle cx="9" cy="17.5" r="0.6" fill="white" opacity="0.25" />
    <circle cx="12" cy="17.5" r="0.6" fill="white" opacity="0.25" />
    <circle cx="15" cy="17.5" r="0.6" fill="white" opacity="0.25" />
    {/* Wheels */}
    <circle cx="5.5" cy="21.5" r="1.5" />
    <circle cx="18.5" cy="21.5" r="1.5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   21. BUTCHER KNIFE  (أدوات التقطيع والسكاكين / scissors)
   ═══════════════════════════════════════════════════════════ */
export const ButcherKnifeIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Blade - wide cleaver shape */}
    <path d="M3 4h14a2 2 0 012 2v8a2 2 0 01-2 2H3V4z" />
    {/* Blade edge highlight */}
    <line x1="3" y1="16" x2="17" y2="16" stroke="white" strokeWidth="0.5" opacity="0.3" />
    {/* Blade surface shine */}
    <path d="M5 6h10v1H5z" fill="white" opacity="0.15" />
    {/* Handle */}
    <rect x="17" y="7" width="6" height="5" rx="1.5" />
    {/* Handle rivets */}
    <circle cx="19" cy="9.5" r="0.6" fill="white" opacity="0.3" />
    <circle cx="21.5" cy="9.5" r="0.6" fill="white" opacity="0.3" />
    {/* Knife tip */}
    <path d="M3 4v12l-1.5-1V5L3 4z" opacity="0.8" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   22. MEAT BAND SAW  (الات تقطيع لحمة / ham)
   ═══════════════════════════════════════════════════════════ */
export const MeatBandSawIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Upper wheel housing */}
    <rect x="4" y="1" width="12" height="6" rx="2" />
    {/* Upper wheel */}
    <circle cx="10" cy="4" r="2" fill="white" opacity="0.15" />
    {/* Blade (vertical) */}
    <rect x="9.5" y="4" width="1" height="13" fill="white" opacity="0.25" />
    {/* Main body / column */}
    <rect x="4" y="7" width="6" height="11" rx="1" />
    {/* Cutting table */}
    <rect x="8" y="14" width="14" height="3" rx="1" />
    {/* Table surface */}
    <rect x="9" y="14.5" width="12" height="1.5" rx="0.3" fill="white" opacity="0.1" />
    {/* Push stick guide */}
    <rect x="16" y="12" width="3" height="2.5" rx="0.5" opacity="0.7" />
    {/* Motor housing bottom */}
    <rect x="3" y="17" width="8" height="3" rx="1" />
    {/* Feet */}
    <rect x="3" y="20" width="4" height="2.5" rx="0.5" />
    <rect x="15" y="17" width="4" height="5.5" rx="0.5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   23. STAINLESS STEEL TABLE  (تجهيزات الستانلس / wrench → stainless-table)
   ═══════════════════════════════════════════════════════════ */
export const StainlessTableIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Back splash */}
    <rect x="2" y="4" width="20" height="3" rx="0.5" />
    {/* Work surface */}
    <rect x="1" y="7" width="22" height="2.5" rx="0.5" />
    {/* Surface shine */}
    <rect x="3" y="7.5" width="18" height="0.5" rx="0.25" fill="white" opacity="0.2" />
    {/* Legs */}
    <rect x="3" y="9.5" width="1.5" height="12" rx="0.3" />
    <rect x="19.5" y="9.5" width="1.5" height="12" rx="0.3" />
    {/* Under shelf */}
    <rect x="3" y="16" width="18" height="1.5" rx="0.3" opacity="0.8" />
    {/* Under shelf surface */}
    <rect x="4" y="16.3" width="16" height="0.4" rx="0.2" fill="white" opacity="0.15" />
    {/* Feet */}
    <circle cx="3.75" cy="22" r="1" />
    <circle cx="20.25" cy="22" r="1" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   24. BUTCHER / CUTTING TABLE  (طاولات تقطيع لحوم / package)
   ═══════════════════════════════════════════════════════════ */
export const CuttingTableIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Thick cutting block top */}
    <rect x="2" y="5" width="20" height="5" rx="1" />
    {/* Block wood grain lines */}
    <line x1="4" y1="7" x2="20" y2="7" stroke="white" strokeWidth="0.3" opacity="0.15" />
    <line x1="4" y1="8.5" x2="20" y2="8.5" stroke="white" strokeWidth="0.3" opacity="0.15" />
    {/* Block highlight */}
    <rect x="3" y="5.5" width="18" height="1" rx="0.3" fill="white" opacity="0.1" />
    {/* Metal frame */}
    <rect x="3" y="10" width="18" height="1" rx="0.2" opacity="0.9" />
    {/* Legs */}
    <rect x="4" y="11" width="1.5" height="10" rx="0.3" />
    <rect x="18.5" y="11" width="1.5" height="10" rx="0.3" />
    {/* Cross brace */}
    <rect x="5" y="16" width="14" height="1" rx="0.3" opacity="0.7" />
    {/* Feet */}
    <circle cx="4.75" cy="21.5" r="1" />
    <circle cx="19.25" cy="21.5" r="1" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   25. MEAT HOOKS / RAIL  (لوازم التعليق والحماية / shield-check)
   ═══════════════════════════════════════════════════════════ */
export const MeatHookRailIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Rail / ceiling bar */}
    <rect x="1" y="2" width="22" height="2.5" rx="1" />
    {/* Hook 1 */}
    <path d="M5 4.5v3a2.5 2.5 0 005 0v-1" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <rect x="4.5" y="4.5" width="1" height="1.5" />
    {/* Hook 2 */}
    <path d="M12 4.5v4a3 3 0 006 0v-1" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <rect x="11.5" y="4.5" width="1" height="1.5" />
    {/* Hook 3 */}
    <path d="M19 4.5v3a2.5 2.5 0 01-5 0v-1" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <rect x="18.5" y="4.5" width="1" height="1.5" />
    {/* Hanging meat suggestion (simple shapes) */}
    <ellipse cx="7" cy="14" rx="2" ry="5" opacity="0.5" />
    <ellipse cx="15" cy="15" rx="2.5" ry="6" opacity="0.5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   26. BAR EQUIPMENT  (معدات البار / wine)
   ═══════════════════════════════════════════════════════════ */
export const BarEquipmentIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Beer tap / dispenser column */}
    <rect x="9" y="1" width="6" height="3" rx="1" />
    {/* Tap handle */}
    <rect x="10.5" y="0" width="3" height="2" rx="1" />
    {/* Tap body */}
    <rect x="8" y="4" width="8" height="8" rx="2" />
    {/* Tap display / badge */}
    <rect x="9.5" y="5.5" width="5" height="5" rx="1" fill="white" opacity="0.15" />
    {/* Tap nozzle */}
    <rect x="11" y="12" width="2" height="2" rx="0.5" />
    <path d="M10.5 14l1.5 2 1.5-2" />
    {/* Drip tray */}
    <rect x="4" y="17" width="16" height="2" rx="1" />
    <rect x="6" y="17.5" width="12" height="1" rx="0.3" fill="white" opacity="0.1" />
    {/* Counter / bar surface */}
    <rect x="2" y="19" width="20" height="3" rx="1" />
    {/* Counter edge */}
    <rect x="3" y="19.5" width="18" height="0.5" rx="0.25" fill="white" opacity="0.15" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   27. BARISTA TOOLS  (أدوات البارستا / glass-water)
   ═══════════════════════════════════════════════════════════ */
export const BaristaToolsIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Portafilter handle */}
    <rect x="1" y="10" width="8" height="3" rx="1.5" />
    {/* Portafilter basket */}
    <path d="M9 8h8a1 1 0 011 1v4a1 1 0 01-1 1H9V8z" />
    {/* Filter basket holes */}
    <circle cx="12" cy="11" r="0.5" fill="white" opacity="0.3" />
    <circle cx="14" cy="11" r="0.5" fill="white" opacity="0.3" />
    <circle cx="13" cy="12.5" r="0.5" fill="white" opacity="0.3" />
    {/* Tamper */}
    <rect x="19" y="3" width="3" height="4" rx="1.5" />
    <rect x="19.5" y="7" width="2" height="1" rx="0.3" />
    <rect x="18.5" y="8" width="4" height="2" rx="1" />
    {/* Milk pitcher */}
    <path d="M2 17h7v5a2 2 0 01-2 2H4a2 2 0 01-2-2v-5z" />
    <path d="M9 17l2-1v2l-2 1" />
    <rect x="2" y="16" width="7" height="1.5" rx="0.5" />
    {/* Pitcher spout */}
    <path d="M2 17l-1 1" stroke={color} strokeWidth="1" fill="none" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   28. REFRIGERATION (root)  (معدات التبريد / thermometer-snowflake)
   ═══════════════════════════════════════════════════════════ */
export const RefrigerationIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Main cabinet */}
    <rect x="4" y="1" width="16" height="20" rx="2" />
    {/* Door panel */}
    <rect x="6" y="3" width="12" height="16" rx="1" fill="white" opacity="0.1" />
    {/* Handle */}
    <rect x="16.5" y="8" width="1" height="5" rx="0.5" fill="white" opacity="0.3" />
    {/* Snowflake symbol */}
    <line x1="12" y1="7" x2="12" y2="14" stroke="white" strokeWidth="0.8" opacity="0.3" />
    <line x1="8.5" y1="8.5" x2="15.5" y2="12.5" stroke="white" strokeWidth="0.8" opacity="0.3" />
    <line x1="15.5" y1="8.5" x2="8.5" y2="12.5" stroke="white" strokeWidth="0.8" opacity="0.3" />
    {/* Snowflake tips */}
    <line x1="11" y1="7.5" x2="12" y2="7" stroke="white" strokeWidth="0.5" opacity="0.25" />
    <line x1="13" y1="7.5" x2="12" y2="7" stroke="white" strokeWidth="0.5" opacity="0.25" />
    {/* Temperature display */}
    <rect x="8" y="15.5" width="4" height="2" rx="0.5" fill="white" opacity="0.15" />
    {/* Feet */}
    <rect x="5" y="21" width="2" height="2" rx="0.5" />
    <rect x="17" y="21" width="2" height="2" rx="0.5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   29. BAKERY EQUIPMENT (root)  (معدات المخابز / croissant)
   ═══════════════════════════════════════════════════════════ */
export const BakeryEquipmentIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Deck oven body */}
    <rect x="2" y="2" width="20" height="18" rx="2" />
    {/* Top deck door */}
    <rect x="4" y="3.5" width="16" height="6" rx="1" fill="white" opacity="0.12" />
    {/* Top deck handle */}
    <rect x="6" y="4" width="12" height="1" rx="0.5" fill="white" opacity="0.2" />
    {/* Top deck window */}
    <rect x="6" y="5.5" width="12" height="3" rx="0.5" fill="white" opacity="0.08" />
    {/* Bottom deck door */}
    <rect x="4" y="10.5" width="16" height="6" rx="1" fill="white" opacity="0.12" />
    {/* Bottom deck handle */}
    <rect x="6" y="11" width="12" height="1" rx="0.5" fill="white" opacity="0.2" />
    {/* Bottom deck window */}
    <rect x="6" y="12.5" width="12" height="3" rx="0.5" fill="white" opacity="0.08" />
    {/* Control panel */}
    <rect x="4" y="17" width="16" height="2" rx="0.5" fill="white" opacity="0.1" />
    <circle cx="8" cy="18" r="0.6" fill="white" opacity="0.25" />
    <circle cx="12" cy="18" r="0.6" fill="white" opacity="0.25" />
    <circle cx="16" cy="18" r="0.6" fill="white" opacity="0.25" />
    {/* Feet */}
    <rect x="3" y="20" width="3" height="2.5" rx="0.5" />
    <rect x="18" y="20" width="3" height="2.5" rx="0.5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   30. BUTCHERY EQUIPMENT (root)  (معدات ملاحم / beef)
   ═══════════════════════════════════════════════════════════ */
export const ButcheryEquipmentIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Band saw upper housing */}
    <path d="M4 2h10a2 2 0 012 2v4H4V4a2 2 0 010-4z" />
    {/* Upper wheel */}
    <circle cx="9" cy="5" r="2" fill="white" opacity="0.15" />
    {/* Saw blade */}
    <rect x="8.5" y="6" width="1" height="8" fill="white" opacity="0.2" />
    {/* Column body */}
    <rect x="3" y="8" width="6" height="9" rx="1" />
    {/* Cutting table */}
    <rect x="7" y="12" width="15" height="3" rx="1" />
    <rect x="8" y="12.5" width="13" height="1" rx="0.3" fill="white" opacity="0.12" />
    {/* Push guide */}
    <rect x="17" y="10" width="3" height="2.5" rx="0.5" opacity="0.7" />
    {/* Base */}
    <rect x="2" y="17" width="8" height="2" rx="1" />
    {/* Legs */}
    <rect x="3" y="15" width="2" height="7" rx="0.5" />
    <rect x="14" y="15" width="2" height="7" rx="0.5" />
    {/* Feet */}
    <rect x="2.5" y="21" width="3" height="1.5" rx="0.5" />
    <rect x="13.5" y="21" width="3" height="1.5" rx="0.5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   31. SHAWARMA TOOLS / ACCESSORIES  (لوازم معدات الشورما)
   ═══════════════════════════════════════════════════════════ */
export const ShawarmaToolsIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill={color} className={className} {...props}>
    {/* Large shawarma knife blade */}
    <path d="M2 6h16a2 2 0 012 2v3a2 2 0 01-2 2H2V6z" />
    <path d="M2 6l-0.5 7h0.5" opacity="0.8" />
    <rect x="4" y="7" width="12" height="0.5" rx="0.25" fill="white" opacity="0.15" />
    {/* Knife handle */}
    <rect x="18" y="7.5" width="5" height="4" rx="1.5" />
    <circle cx="20" cy="9.5" r="0.5" fill="white" opacity="0.3" />
    <circle cx="22" cy="9.5" r="0.5" fill="white" opacity="0.3" />
    {/* Skewer / spit rod */}
    <rect x="3" y="16" width="18" height="1.2" rx="0.6" />
    {/* Spit tip */}
    <path d="M21 16.6l2-0.6v1.2l-2-0.6z" />
    {/* Drip tray */}
    <path d="M5 20h14v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2z" />
    <rect x="5" y="19.5" width="14" height="1" rx="0.3" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   FALLBACK / DEFAULT  (Grid pattern)
   ═══════════════════════════════════════════════════════════ */
export const DefaultEquipmentIcon: React.FC<EquipmentIconProps> = ({
  size = 24, color = 'currentColor', className, ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className} {...props}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);
