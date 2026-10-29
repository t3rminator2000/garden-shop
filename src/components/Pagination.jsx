import Icon from './Icon'

function pageList(page, pages) {
  const set = new Set([1, pages, page - 1, page, page + 1])
  const nums = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b)
  const out = []
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push('…')
    out.push(n)
  })
  return out
}

// ‹ 1 2 3 … 14 ›
export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null
  return (
    <nav className="pagination" aria-label="Страницы">
      <button type="button" className="pagination__btn" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Предыдущая страница">
        <Icon name="chevron-left" size={18} />
      </button>
      {pageList(page, pages).map((n, i) =>
        n === '…' ? (
          <span key={`dots-${i}`} className="pagination__dots" aria-hidden="true">…</span>
        ) : (
          <button
            key={n}
            type="button"
            className={`pagination__btn${n === page ? ' is-active' : ''}`}
            onClick={() => onChange(n)}
            aria-label={`Страница ${n}`}
            aria-current={n === page ? 'page' : undefined}
          >
            {n}
          </button>
        ),
      )}
      <button type="button" className="pagination__btn" onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="Следующая страница">
        <Icon name="chevron-right" size={18} />
      </button>
    </nav>
  )
}
