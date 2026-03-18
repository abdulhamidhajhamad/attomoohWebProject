/**
 * IconResolver — Maps icon string keys to custom equipment SVG components
 *
 * Used to dynamically render icons stored in the database as strings.
 * Icons are bold, filled machine/equipment silhouettes (not Lucide line icons).
 * Add new mappings here when new icon keys are needed.
 */

import type { FC } from 'react';
import {
  EspressoMachineIcon,
  CoffeeGrinderIcon,
  CommercialBlenderIcon,
  StandMixerIcon,
  CommercialOvenIcon,
  DisplayFridgeIcon,
  UprightFridgeIcon,
  PrepCounterFridgeIcon,
  IceCreamDisplayIcon,
  DishwasherIcon,
  MeatSlicerIcon,
  MeatGrinderIcon,
  ShawarmaMachineIcon,
  DoughSheeterIcon,
  FoodProcessorIcon,
  IceMachineIcon,
  CookingRangeIcon,
  DeepFryerIcon,
  DoughProoferIcon,
  ButcherKnifeIcon,
  MeatBandSawIcon,
  StainlessTableIcon,
  CuttingTableIcon,
  MeatHookRailIcon,
  BarEquipmentIcon,
  BaristaToolsIcon,
  RefrigerationIcon,
  BakeryEquipmentIcon,
  ButcheryEquipmentIcon,
  ShawarmaToolsIcon,
  DefaultEquipmentIcon,
  type EquipmentIconProps,
} from './equipment-icons';

/** The type used for all category icon components */
export type CategoryIcon = FC<EquipmentIconProps>;

const ICON_MAP: Record<string, CategoryIcon> = {
  /* ── Root-level category icons ── */
  'wine':                   BarEquipmentIcon,          // معدات البار
  'thermometer-snowflake':  RefrigerationIcon,         // معدات التبريد
  'sparkles':               DishwasherIcon,            // معدات الجلي
  'flame':                  ShawarmaMachineIcon,       // معدات الشورما (root)
  'croissant':              BakeryEquipmentIcon,       // معدات المخابز
  'chef-hat':               CookingRangeIcon,          // معدات مطاعم
  'beef':                   ButcheryEquipmentIcon,     // معدات ملاحم

  /* ── Bar & Beverages ── */
  'coffee':                 EspressoMachineIcon,       // ماكينات القهوة
  'glass-water':            BaristaToolsIcon,          // أدوات البارستا
  'blend':                  CommercialBlenderIcon,     // محضرات المشروبات
  'cog':                    CoffeeGrinderIcon,         // مطاحن القهوة و البهارات

  /* ── Refrigeration ── */
  'snowflake':              PrepCounterFridgeIcon,     // ثلاجات التحضير
  'warehouse':              UprightFridgeIcon,         // ثلاجات التخزين
  'refrigerator':           DisplayFridgeIcon,         // ثلاجات العرض
  'ice-cream-cone':         IceCreamDisplayIcon,       // ثلاجات عرض البوظة
  'droplets':               IceMachineIcon,            // صانعة الثلج

  /* ── Bakery ── */
  'disc3':                  StandMixerIcon,            // العجانات
  'wheat':                  DoughProoferIcon,          // خمارات العجين
  'circle-dot':             DoughSheeterIcon,          // رقاقات العجين

  /* ── Restaurant ── */
  'cooking-pot':            CommercialOvenIcon,        // أفران المطاعم
  'utensils':               FoodProcessorIcon,         // محضرات الطعام
  'zap':                    DeepFryerIcon,             // شبسرات

  /* ── Butchery ── */
  'slice':                  MeatSlicerIcon,            // آلات تشريح لحوم
  'ham':                    MeatBandSawIcon,           // الات تقطيع لحمة
  'drumstick':              MeatGrinderIcon,           // الات فرم لحمة
  'scissors':               ButcherKnifeIcon,          // أدوات التقطيع والسكاكين
  'package':                CuttingTableIcon,          // طاولات تقطيع لحوم
  'shield-check':           MeatHookRailIcon,          // لوازم التعليق والحماية

  /* ── Shawarma ── */
  'diameter':               ShawarmaMachineIcon,       // آلات الشورما
  'wrench':                 ShawarmaToolsIcon,         // لوازم معدات الشورما / تجهيزات الستانلس

  /* ── Aliases (backward compat) ── */
  'flame-kindling':         ShawarmaMachineIcon,
  'cup-soda':               CommercialBlenderIcon,
  'knife':                  ButcherKnifeIcon,
  'scale':                  StainlessTableIcon,
  'sandwich':               CookingRangeIcon,
  'soup':                   CookingRangeIcon,
  'vegan':                  FoodProcessorIcon,
};

/**
 * Resolve an icon key string to a custom equipment icon component.
 * Returns undefined if the key is not found.
 */
export function getLucideIcon(key?: string): CategoryIcon | undefined {
  if (!key) return undefined;
  return ICON_MAP[key.toLowerCase()];
}

/** Fallback icon when no match found */
export const DefaultCategoryIcon = DefaultEquipmentIcon;
