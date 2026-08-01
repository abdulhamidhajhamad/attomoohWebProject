import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
}

export function useSEO({
  title,
  description,
  keywords,
  ogImage,
  canonical,
}: SEOProps) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const suffix =
      i18n.language === 'ar'
        ? 'شركة الطموح للتوريدات الصناعية | تجهيزات المطابخ الصناعية'
        : 'Attomooh | Kitchen Equipment';

    if (title) {
      document.title = `${title} | ${suffix}`;
    } else {
      document.title = suffix;
    }

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) ||
        document.querySelector(`meta[property="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        if (name.startsWith('og:') || name.startsWith('twitter:')) {
          el.setAttribute('property', name);
        } else {
          el.setAttribute('name', name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    if (description) {
      setMeta('description', description);
      setMeta('og:description', description);
      setMeta('twitter:description', description);
    }
    if (keywords) setMeta('keywords', keywords);
    if (ogImage) {
      setMeta('og:image', ogImage);
      setMeta('twitter:image', ogImage);
    }
    if (title) {
      setMeta('og:title', `${title} | ${suffix}`);
      setMeta('twitter:title', `${title} | ${suffix}`);
    }
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    }

    return () => {
      // Cleanup handled by next call
    };
  }, [title, description, keywords, ogImage, canonical, i18n.language]);
}
