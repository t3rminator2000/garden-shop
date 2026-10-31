import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'
import { SelectField, TextField } from '../../components/Fields'
import { EmptyState, ErrorState, Spinner } from '../../components/States'
import { ApiError, clientsApi, ordersApi } from '../../api'
import { ADMIN_PER_PAGE, REGIONS } from '../../constants'
import { useUI } from '../../context/UIContext'
import { useAsync } from '../../hooks/useAsync'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { addressLine, formatPrice, normalize } from '../../utils/format'

const EMPTY = { id: null, name: '', email: '', phone: '', region: '', index: '', city: '', street: '', house: '', flat: '' }

const toForm = (c) => ({
  id: c.id,
  name: c.name,
  email: c.email,
  phone: c.phone,
  region: c.address.region || '',
  index: c.address.index || '',
  city: c.address.city || '',
  street: c.address.street || '',
  house: c.address.house || '',
  flat: c.address.flat || '',
})

// Админ-панель: клиенты. Заказы ссылаются на клиента по номеру,
// поэтому здесь же видно, сколько заказов у каждого и на какую сумму.
export default function AdminClients() {
  useDocumentTitle('Админ-панель: клиенты')
  const { showToast } = useUI()
  const { data, loading, error, reload } = useAsync(async () => {
    const [clients, orders] = await Promise.all([clientsApi.listClients(), ordersApi.listOrders()])
    return { clients, orders }
  }, [])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const formRef = useRef(null)

  const rowsAll = useMemo(() => {
    const orders = data?.orders || []
    const needle = normalize(q)
    return (data?.clients || [])
      .map((c) => {
        const own = orders.filter((o) => o.clientId === c.id)
        return { ...c, ordersCount: own.length, ordersSum: own.reduce((s, o) => s + (Number(o.total) || 0), 0) }
      })
      .filter((c) => !needle || normalize(`${c.name} ${c.email} ${c.phone}`).includes(needle))
  }, [data, q])

  const pages = Math.max(1, Math.ceil(rowsAll.length / ADMIN_PER_PAGE))
  const current = Math.min(page, pages)
  const rows = rowsAll.slice((current - 1) * ADMIN_PER_PAGE, current * ADMIN_PER_PAGE)
  useEffect(() => setPage(1), [q])

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const openForm = (client) => {
    setForm(client ? toForm(client) : EMPTY)
    setErrors({})
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      formRef.current?.querySelector('input')?.focus({ preventScroll: true })
    }, 0)
  }

  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const saved = await clientsApi.saveClient({
        id: form.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: { region: form.region, index: form.index, city: form.city, street: form.street, house: form.house, flat: form.flat },
      })
      setErrors({})
      showToast(form.id ? `Клиент «${saved.name}» сохранён` : `Клиент «${saved.name}» добавлен`, 'success')
      setForm(EMPTY)
      reload()
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setErrors(err.fields)
        setTimeout(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus(), 0)
      }
      showToast(err instanceof ApiError ? err.message : 'Не удалось сохранить клиента', 'error')
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    const c = toDelete
    setToDelete(null)
    try {
      await clientsApi.deleteClient(c.id)
      showToast(`Клиент «${c.name}» удалён`, 'success')
      if (form.id === c.id) setForm(EMPTY)
      reload()
    } catch {
      showToast('Не удалось удалить клиента', 'error')
    }
  }

  return (
    <>
      <div className="admin__head">
        <h1 className="page-title">Клиенты</h1>
        <div className="admin__head-actions">
          <button type="button" className="btn btn--primary" onClick={() => openForm(null)}><Icon name="plus" size={16} /> Добавить клиента</button>
        </div>
      </div>
      <p className="muted-note">Клиенты приходят из файла clients.json и пополняются при оформлении заказов. Заказ хранит номер клиента, поэтому в таблице видно количество заказов и сумму.</p>

      <div className="admin__filters">
        <TextField className="admin__search" label="Поиск по имени, почте или телефону" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <div style={{ textAlign: 'center' }}><Spinner /></div>
      ) : !rowsAll.length ? (
        <EmptyState icon="search" title="Клиенты не найдены" text="Измените поиск" />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">Список клиентов</caption>
              <thead>
                <tr><th scope="col">Номер</th><th scope="col">ФИО</th><th scope="col">Контакты</th><th scope="col">Адрес</th><th scope="col">Заказов</th><th scope="col">На сумму</th><th scope="col">Действия</th></tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td data-label="Номер">{c.id}</td>
                    <td data-label="ФИО">{c.name}{c.ownerKey ? <> <span className="tag tag--on">есть вход</span></> : null}</td>
                    <td data-label="Контакты">{c.email}<br />{c.phone || '-'}</td>
                    <td data-label="Адрес">{addressLine({ address: c.address }) || '-'}</td>
                    <td data-label="Заказов">{c.ordersCount}</td>
                    <td data-label="На сумму">{formatPrice(c.ordersSum)}</td>
                    <td data-label="Действия">
                      <div className="table__actions">
                        <button type="button" className="link-btn" onClick={() => openForm(c)} aria-label={`Изменить «${c.name}»`}>Изменить</button>
                        <button type="button" className="link-btn link-btn--danger" onClick={() => setToDelete(c)} aria-label={`Удалить «${c.name}»`}>Удалить</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={current} pages={pages} onChange={setPage} />
        </>
      )}

      <h2 className="admin__h2">Карточка клиента: добавление и редактирование</h2>
      <form className="panel admin__form" onSubmit={save} noValidate ref={formRef} aria-label="Карточка клиента">
        <p className="muted-note">{form.id ? `Редактирование клиента № ${form.id}` : 'Новый клиент'}</p>
        <div className="admin__cols">
          <div className="admin__col">
            <TextField label="ФИО" required value={form.name} error={errors.name} maxLength={120} onChange={(e) => setF('name', e.target.value)} />
            <TextField label="E-mail" required type="email" value={form.email} error={errors.email} onChange={(e) => setF('email', e.target.value)} />
            <TextField label="Телефон" type="tel" value={form.phone} error={errors.phone} onChange={(e) => setF('phone', e.target.value)} />
          </div>
          <div className="admin__col">
            <SelectField label="Регион" value={form.region} placeholder="Не указан" options={REGIONS.map((r) => ({ value: r.name, label: r.name }))} onChange={(e) => setF('region', e.target.value)} />
            <div className="panel__row">
              <TextField label="Индекс" inputMode="numeric" value={form.index} maxLength={6} onChange={(e) => setF('index', e.target.value.replace(/\D/g, ''))} />
              <TextField label="Город" value={form.city} maxLength={60} onChange={(e) => setF('city', e.target.value)} />
            </div>
            <TextField label="Улица" value={form.street} maxLength={120} onChange={(e) => setF('street', e.target.value)} />
            <div className="panel__row">
              <TextField label="Дом" value={form.house} maxLength={10} onChange={(e) => setF('house', e.target.value)} />
              <TextField label="Квартира" value={form.flat} maxLength={10} onChange={(e) => setF('flat', e.target.value)} />
            </div>
            <div className="panel__row panel__row--actions">
              <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? 'Сохраняем…' : 'Сохранить'}</button>
              <button type="button" className="btn btn--outline" onClick={() => { setForm(EMPTY); setErrors({}) }}>Отмена</button>
            </div>
          </div>
        </div>
      </form>

      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Удалить клиента?" size="sm">
        <p>Клиент «{toDelete?.name}» будет удалён. Его заказы останутся в списке заказов.</p>
        <div className="modal__actions">
          <button type="button" className="btn btn--outline" onClick={() => setToDelete(null)}>Отмена</button>
          <button type="button" className="btn btn--danger" onClick={confirmDelete}>Удалить</button>
        </div>
      </Modal>
    </>
  )
}
