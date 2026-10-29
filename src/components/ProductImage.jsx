import { useState } from 'react'
import PhotoPlaceholder from './PhotoPlaceholder'

// Показывает фото товара, а если его нет или файл не загрузился - заглушку.
export default function ProductImage({ product, index = 0, label = 'Фото товара', className = '', iconSize }) {
  const [failed, setFailed] = useState(false)
  const src = product?.images?.[index]
  if (!src || failed) return <PhotoPlaceholder label={label} className={className} iconSize={iconSize} />
  return (
    <img
      className={`product-img ${className}`.trim()}
      src={src}
      alt={product.title}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
