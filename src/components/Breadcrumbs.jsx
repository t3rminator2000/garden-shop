import { Link } from 'react-router-dom'

// items: [{ label, to }], у последнего элемента to не нужен
export default function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs" aria-label="Хлебные крошки">
      <ol>
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`}>
              {last || !item.to ? <span aria-current={last ? 'page' : undefined}>{item.label}</span> : <Link to={item.to}>{item.label}</Link>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
