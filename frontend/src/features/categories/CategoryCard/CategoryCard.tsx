import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { Category } from '../../../shared/types';
import { useLocalizedValue } from '../../../shared/hooks/useLocalizedValue';
import styles from './CategoryCard.module.css';

interface CategoryCardProps {
  category: Category;
  compact?: boolean;
}

export const CategoryCard = memo(function CategoryCard({
  category,
  compact = false,
}: CategoryCardProps) {
  const name = useLocalizedValue(category.name);

  return (
    <Link
      to={`/categories/${category.slug}`}
      className={`${styles.card} ${compact ? styles.compact : ''}`}
      aria-label={name}
    >
      <span className={styles.name}>{name}</span>
      {!compact && (
        <span className={styles.count}>
          {category.productCount}+
        </span>
      )}
    </Link>
  );
});
