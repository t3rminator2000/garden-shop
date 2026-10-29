import ProductCard from './ProductCard'
import { ProductSkeletons } from './States'

export default function ProductGrid({ items = [], loading = false, skeletons = 9, columns = 3 }) {
  return (
    <div className={`grid grid--cols-${columns}`} aria-busy={loading}>
      {loading && !items.length ? <ProductSkeletons count={skeletons} /> : items.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}
