/**
 * Slider Store — Zustand persist store for hero slider images
 *
 * يحفظ صور السلايدر في localStorage حتى تحمّل الصور من الباك اند
 * عند توفر الـ API يمكن استبدال هذا بـ useEffect + fetch
 *
 * Features:
 * - Add slides (up to 7)
 * - Remove slides
 * - Reorder slides (move up/down)
 * - Toggle slide active state
 * - Persist across sessions
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SliderImage {
  id: string;
  publicId: string;
  secureUrl: string;
  title?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
}

interface SliderStore {
  slides: SliderImage[];

  /** Add a new slide (max 7) */
  addSlide: (slide: Omit<SliderImage, 'id' | 'order' | 'createdAt'>) => void;

  /** Remove a slide by id */
  removeSlide: (id: string) => void;

  /** Toggle active state */
  toggleSlide: (id: string) => void;

  /** Update slide title */
  updateSlideTitle: (id: string, title: string) => void;

  /** Move slide up in order */
  moveUp: (id: string) => void;

  /** Move slide down in order */
  moveDown: (id: string) => void;

  /** Get only active slides sorted by order */
  getActiveSlides: () => SliderImage[];
}

const MAX_SLIDES = 7;

export const useSliderStore = create<SliderStore>()(
  persist(
    (set, get) => ({
      slides: [],

      addSlide: (slide) => {
        const { slides } = get();
        if (slides.length >= MAX_SLIDES) return;

        const newSlide: SliderImage = {
          ...slide,
          id: `slide_${Date.now()}`,
          order: slides.length,
          createdAt: new Date().toISOString(),
        };

        set({ slides: [...slides, newSlide] });
      },

      removeSlide: (id) => {
        const { slides } = get();
        const filtered = slides
          .filter((s) => s.id !== id)
          .map((s, i) => ({ ...s, order: i }));
        set({ slides: filtered });
      },

      toggleSlide: (id) => {
        const { slides } = get();
        set({
          slides: slides.map((s) =>
            s.id === id ? { ...s, isActive: !s.isActive } : s,
          ),
        });
      },

      updateSlideTitle: (id, title) => {
        const { slides } = get();
        set({
          slides: slides.map((s) =>
            s.id === id ? { ...s, title } : s,
          ),
        });
      },

      moveUp: (id) => {
        const { slides } = get();
        const idx = slides.findIndex((s) => s.id === id);
        if (idx <= 0) return;

        const newSlides = [...slides];
        [newSlides[idx - 1], newSlides[idx]] = [newSlides[idx], newSlides[idx - 1]];
        set({ slides: newSlides.map((s, i) => ({ ...s, order: i })) });
      },

      moveDown: (id) => {
        const { slides } = get();
        const idx = slides.findIndex((s) => s.id === id);
        if (idx < 0 || idx >= slides.length - 1) return;

        const newSlides = [...slides];
        [newSlides[idx], newSlides[idx + 1]] = [newSlides[idx + 1], newSlides[idx]];
        set({ slides: newSlides.map((s, i) => ({ ...s, order: i })) });
      },

      getActiveSlides: () => {
        const { slides } = get();
        return slides
          .filter((s) => s.isActive)
          .sort((a, b) => a.order - b.order);
      },
    }),
    {
      name: 'attomooh-slider',
    },
  ),
);
