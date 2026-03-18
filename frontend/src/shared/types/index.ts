export interface Product {
  id: string;
  slug: string;
  name: {
    ar: string;
    en: string;
  };
  description: {
    ar: string;
    en: string;
  };
  price: number;
  originalPrice?: number;
  currency: string;
  categoryIds: string[];
  images: string[];
  inStock: boolean;
  isNew?: boolean;
  isOnSale?: boolean;
  specifications?: Record<string, { ar: string; en: string }>;
}

export interface Category {
  id: string;
  slug: string;
  name: {
    ar: string;
    en: string;
  };
  description: {
    ar: string;
    en: string;
  };
  icon?: string;
  image?: string;
  parentIds: string[];
  level: number;
  children?: Category[];
  productCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ContactInfo {
  phone: string;
  whatsapp: string;
  email: string;
  address: {
    ar: string;
    en: string;
  };
  workingHours: {
    ar: string;
    en: string;
  };
}
