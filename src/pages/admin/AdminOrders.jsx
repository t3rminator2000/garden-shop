import { useEffect, useMemo, useState } from 'react'
import Icon from '../../components/Icon'
import Modal from '../../components/Modal'
import OrderInvoice from '../../components/OrderInvoice'
import OrderStatus from '../../components/OrderStatus'
import Pagination from '../../components/Pagination'
import { SelectField, TextField } from '../../components/Fields'
import { EmptyState, ErrorState, Spinner } from '../../components/States'
import { ApiError, ordersApi } from '../../api'
import { ADMIN_ORDERS_PER_PAGE, DELIVERY, ORDER_STATUS, PAYMENTS } from '../../constants'
import { useUI } from '../../context/UIContext'
import { useAsync } from '../../hooks/useAsync'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { addressLine, formatDate, formatPrice, normalize, orderNumber } from '../../utils/format'

const CHIPS = [
  { id: 'all', label: 'Все' },
  { id: 'new', label: 'Новые' },
  { id: 'processing', label: 'В обработке' },
  { id: 'shipped', label: 'Отправлены' },
  { id: 'delivered', label: 'Доставлены' },
  { id: 'cancelled', label: 'Отменены' },
]
const PERIODS = [{ value: '', label: 'Дата: за всё время' }, { value: '7', label: 'Дата: за 7 дней' }, { value: '30', label: 'Дата: за 30 дней' }]
const dayMs = 86400000

// Админ-панель: заказы (макет «Админ-панель (заказы)»)
export default function AdminOrders() {
  useDocumentTitle('Админ-панель: заказы')
  const { showToast } = useUI()
  const { data, loading, error, reload } = useAsync(() => ordersApi.listOrders(), [])
  const [chip, setChip] = useState('all')
  const [q, setQ] = useState('')
  const [period, setPeriod] = useState('')
  const [deliveryFilter, setDeliveryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState(null)
  const [status, setStatus] = useState('new')
  const [busy, setBusy] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const counts = useMemo(() => {
    const c = { all: (data || []).length }
    ;(data || []).forEach((o) => { c[o.status] = (c[o.status] || 0) + 1 })
    return c
  }, [data])

  const filtered = useMemo(() => {
    const text = normalize(q)
    const digits = q.replace(/\D/g, '')
    const since = period ? Date.now() - Number(period) * dayMs : 0
    return (data || [])
      .filter((o) => chip === 'all' || o.status === chip)
      .filter((o) => !deliveryFilter || o.delivery === deliveryFilter)
      .filter((o) => !since || new Date(o.createdAt).getTime() >= since)
      .filter((o) => !text || normalize(o.contact.name).includes(text) || (digits && (String(o.id).includes(digits) || o.contact.phone.replace(/\D/g, '').includes(digits))))
  }, [data, chip, q, period, deliveryFilter])

  useEffect(() => setPage(1), [chip, q, period, deliveryFilter])
  const pages = Math.max(1, Math.ceil(filtered.length / ADMIN_ORDERS_PER_PAGE))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * ADMIN_ORDERS_PER_PAGE, current * ADMIN_ORDERS_PER_PAGE)

  const selected = (data || []).find((o) => o.id === selectedId) || null
  useEffect(() => {
    if (selected) setStatus(selected.status)
  }, [selected?.id, selected?.status])
  useEffect(() => {
    if (data?.length && !data.some((o) => o.id === selectedId)) setSelectedId(data[0].id)
  }, [data, selectedId])

  const changeStatus = async (next, message) => {
    setBusy(true)
    try {
      await ordersApi.updateOrderStatus(selected.id, next)
      showToast(message, 'success')
      reload()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Не удалось изменить статус', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h1 className="page-title">Заказы</h1>

      <div className="chips" role="group" aria-label="Фильтр по статусу">
        {CHIPS.map((c) => (
          <button key={c.id} type="button" className={`chip chip--status${chip === c.id ? ' is-active' : ''}`} aria-pressed={chip === c.id} onClick={() => setChip(c.id)}>
            {c.label} ({counts[c.id] || 0})
          </button>
        ))}
      </div>

      <div className="admin__filters">
        <TextField className="admin__search" label="Поиск по номеру заказа, имени или телефону" value={q} onChange={(e) => setQ(e.target.value)} maxLength={60} />
        <SelectField label="Период" value={period} options={PERIODS} onChange={(e) => setPeriod(e.target.value)} />
        <SelectField label="Доставка" value={deliveryFilter} placeholder="Любая" options={DELIVERY.map((d) => ({ value: d.id, label: d.title }))} onChange={(e) => setDeliveryFilter(e.target.value)} />
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <div style={{ textAlign: 'center' }}><Spinner /></div>
      ) : !filtered.length ? (
        <EmptyState icon="box" title="Заказы не найдены" text="Измените статус, поиск или фильтры" />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">Список заказов</caption>
              <thead>
                <tr><th scope="col">Заказ</th><th scope="col">Дата</th><th scope="col">Покупатель</th><th scope="col">Доставка</th><th scope="col">Сумма</th><th scope="col">Статус</th><th scope="col">Действия</th></tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} className={o.id === selectedId ? 'is-selected' : ''}>
                    <td data-label="Заказ">{orderNumber(o.id)}</td>
                    <td data-label="Дата">{formatDate(o.createdAt)}</td>
                    <td data-label="Покупатель">{o.contact.name}<span className="table__sub">{o.contact.phone}</span></td>
                    <td data-label="Доставка">{DELIVERY.find((d) => d.id === o.delivery)?.title}</td>
                    <td data-label="Сумма"><strong>{formatPrice(o.total)}</strong></td>
                    <td data-label="Статус"><OrderStatus status={o.status} audience="admin" /></td>
                    <td data-label="Действия"><button type="button" className="link-btn" onClick={() => setSelectedId(o.id)} aria-label={`Открыть заказ ${orderNumber(o.id)}`}>Открыть</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={current} pages={pages} onChange={setPage} />
        </>
      )}

      {selected && (
        <>
          <h2 className="admin__h2">Заказ {orderNumber(selected.id)}: подробно</h2>
          <div className="panel admin__detail">
            <div className="admin__detail-col">
              <h3 className="panel__title">Состав заказа</h3>
              <ul className="summary__lines">
                {selected.items.map((i) => (
                  <li key={i.productId}><span>{i.title} × {i.qty}</span><strong>{formatPrice(i.price * i.qty)}</strong></li>
                ))}
                <li><span>Доставка ({DELIVERY.find((d) => d.id === selected.delivery)?.title})</span><strong>{selected.deliveryCost === 0 ? 'Бесплатно' : formatPrice(selected.deliveryCost)}</strong></li>
                {selected.discount > 0 && (
                  <li className="summary__discount"><span>Скидка по промокоду {selected.promo}</span><strong>−{formatPrice(selected.discount)}</strong></li>
                )}
              </ul>
              <p className="summary__total-line"><span>Итого</span><strong>{formatPrice(selected.total)}</strong></p>
              {selected.comment && <p className="muted-note">Комментарий покупателя: {selected.comment}</p>}
            </div>
            <div className="admin__detail-col">
              <h3 className="panel__title">Покупатель и доставка</h3>
              <p>{selected.contact.name}</p>
              <p className="muted-note">{selected.contact.phone}{selected.contact.email ? ` · ${selected.contact.email}` : ''}</p>
              <p className="muted-note">{addressLine(selected) || '-'}</p>
              <p className="muted-note">Оплата: {PAYMENTS.find((p) => p.id === selected.payment)?.short}</p>

              <SelectField label="Статус заказа" value={status} onChange={(e) => setStatus(e.target.value)} options={Object.entries(ORDER_STATUS).map(([value, v]) => ({ value, label: v.admin }))} hint="Новый → В обработке → Отправлен → Доставлен. Отменить можно на любом шаге" />
              <div className="panel__row panel__row--actions">
                <button type="button" className="btn btn--primary" disabled={busy || status === selected.status} onClick={() => changeStatus(status, `Статус заказа ${orderNumber(selected.id)} обновлён`)}>Сохранить статус</button>
                <button type="button" className="btn btn--outline" disabled={busy || selected.status === 'cancelled'} onClick={() => setConfirmCancel(true)}>Отменить заказ</button>
              </div>
              <button type="button" className="btn btn--ghost" onClick={() => window.print()}>
                <Icon name="print" size={18} /> Печать накладной
              </button>
              <p className="muted-note">Накладная печатается на отдельном листе: состав заказа, адрес и место для подписей.</p>
            </div>
          </div>

          <OrderInvoice order={selected} />
        </>
      )}

      <Modal open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Отменить заказ?" size="sm">
        <p>Заказ {selected ? orderNumber(selected.id) : ''} получит статус «Отменён». Покупатель увидит это в личном кабинете.</p>
        <div className="modal__actions">
          <button type="button" className="btn btn--outline" onClick={() => setConfirmCancel(false)}>Нет</button>
          <button type="button" className="btn btn--danger" onClick={() => { setConfirmCancel(false); changeStatus('cancelled', 'Заказ отменён') }}>Отменить заказ</button>
        </div>
      </Modal>
    </>
  )
}
