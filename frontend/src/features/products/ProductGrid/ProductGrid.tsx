import { memo } from 'react';
import { Package } from 'lucide-react';
import type { Product } from '../../../shared/types';
import { ProductCard } from '../ProductCard/ProductCard';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
  products: Product[];
}

export const ProductGrid = memo(function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b7280' }}>
        <Package size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>لا توجد منتجات حالياً</p>
        <p style={{ fontSize: '0.85rem', marginTop: 4 }}>سيتم إضافة المنتجات قريباً</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
});
