import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'
import ProductImage from '../../components/ProductImage'
import PhotoPlaceholder from '../../components/PhotoPlaceholder'
import { Checkbox, SelectField, TextField } from '../../components/Fields'
import { EmptyState, ErrorState, Spinner } from '../../components/States'
import { ApiError, catalogApi } from '../../api'
import { ADMIN_PER_PAGE, CATEGORIES, getCategory } from '../../constants'
import { useUI } from '../../context/UIContext'
import { useAsync } from '../../hooks/useAsync'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { formatPrice, goodsLabel, normalize } from '../../utils/format'
import { downloadText } from '../../utils/csv'
import { validateImageUrl, validateNumber } from '../../utils/validators'

const EMPTY = { id: null, title: '', category: '', sku: '', stock: '', price: '', discount: '', description: '', image: '', published: true, specs: [['', ''], ['', '']] }

const toForm = (p) => ({
  id: p.id,
  title: p.title,
  category: p.category,
  sku: p.sku,
  stock: String(p.stock),
  price: String(p.price),
  discount: p.discount ? String(p.discount) : '',
  description: p.description,
  image: p.images[0] || '',
  published: p.published,
  specs: p.specs.length ? p.specs.map((s) => [...s]) : [['', '']],
})

function validate(f) {
  return {
    title: f.title.trim().length < 2 ? 'Введите название товара' : '',
    category: f.category ? '' : 'Выберите категорию',
    stock: validateNumber(f.stock, { min: 0, max: 100000, integer: true, label: 'остаток', required: false }),
    price: validateNumber(f.price, { min: 1, max: 1000000, label: 'цену' }),
    discount: validateNumber(f.discount, { min: 0, max: 90, label: 'скидку', required: false }),
    image: validateImageUrl(f.image),
  }
}

// Админ-панель: товары (макет «Админ-панель (товары)»)
export default function AdminProducts() {
  useDocumentTitle('Админ-панель: товары')
  const { showToast } = useUI()
  const { data, loading, error, reload } = useAsync(() => catalogApi.listAdminProducts(), [])
  const [filters, setFilters] = useState({ q: '', category: '', stock: '', publish: '' })
  const [page, setPage] = useState(1)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importReport, setImportReport] = useState(null)
  const formRef = useRef(null)
  const fileRef = useRef(null)

  // Выгрузка каталога файлом
  const exportTo = async (format) => {
    try {
      const text = await catalogApi.exportProducts(format)
      const date = new Date().toISOString().slice(0, 10)
      downloadText(`tovary-${date}.${format}`, text, format === 'json' ? 'application/json;charset=utf-8' : 'text/csv;charset=utf-8')
      showToast('Файл каталога сохранён', 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Не удалось выгрузить каталог', 'error')
    }
  }

  // Загрузка каталога из файла. Файл читается прямо в браузере, сервер не нужен.
  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return showToast('Файл больше 2 МБ, разбейте его на части', 'error')
    setImporting(true)
    setImportReport(null)
    try {
      const text = await file.text()
      const report = await catalogApi.importProducts(text)
      setImportReport(report)
      showToast(`Загружено: ${goodsLabel(report.added + report.updated)}`, 'success')
      reload()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Не удалось прочитать файл', 'error')
    } finally {
      setImporting(false)
    }
  }

  const filtered = useMemo(() => {
    const q = normalize(filters.q)
    return (data || [])
      .filter((p) => !q || normalize(p.title).includes(q) || p.sku.includes(q))
      .filter((p) => !filters.category || p.category === filters.category)
      .filter((p) => !filters.stock || (filters.stock === 'in' ? p.inStock : !p.inStock))
      .filter((p) => !filters.publish || (filters.publish === 'on' ? p.published : !p.published))
      .sort((a, b) => a.id - b.id)
  }, [data, filters])

  const pages = Math.max(1, Math.ceil(filtered.length / ADMIN_PER_PAGE))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * ADMIN_PER_PAGE, current * ADMIN_PER_PAGE)
  useEffect(() => setPage(1), [filters])

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }))
  const openForm = (product) => {
    setForm(product ? toForm(product) : EMPTY)
    setErrors({})
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      formRef.current?.querySelector('input')?.focus({ preventScroll: true })
    }, 0)
  }

  const save = async (e) => {
    e.preventDefault()
    const next = validate(form)
    setErrors(next)
    if (Object.values(next).some(Boolean)) {
      setTimeout(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus(), 0)
      return
    }
    setBusy(true)
    try {
      const saved = await catalogApi.saveProduct({
        ...form,
        price: form.price.replace(',', '.'),
        discount: form.discount === '' ? 0 : Number(form.discount),
        stock: form.stock === '' ? 0 : Number(form.stock),
      })
      showToast(form.id ? `Товар «${saved.title}» сохранён` : `Товар «${saved.title}» добавлен`, 'success')
      setForm(EMPTY)
      reload()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Не удалось сохранить товар', 'error')
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    const p = toDelete
    setToDelete(null)
    try {
      await catalogApi.deleteProduct(p.id)
      showToast(`Товар «${p.title}» удалён`, 'success')
      if (form.id === p.id) setForm(EMPTY)
      reload()
    } catch {
      showToast('Не удалось удалить товар', 'error')
    }
  }

  const setSpec = (i, j, v) => setForm((f) => ({ ...f, specs: f.specs.map((s, k) => (k === i ? (j === 0 ? [v, s[1]] : [s[0], v]) : s)) }))

  return (
    <>
      <div className="admin__head">
        <h1 className="page-title">Товары</h1>
        <div className="admin__head-actions">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="sr-only"
            onChange={onFile}
          />
          <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()} disabled={importing}>
            <Icon name="upload" size={16} /> {importing ? 'Загружаем…' : 'Импорт из файла'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => exportTo('csv')}><Icon name="download" size={16} /> Экспорт CSV</button>
          <button type="button" className="btn btn--ghost" onClick={() => exportTo('json')}><Icon name="download" size={16} /> Экспорт JSON</button>
          <button type="button" className="btn btn--primary" onClick={() => openForm(null)}><Icon name="plus" size={16} /> Добавить товар</button>
        </div>
      </div>
      <p className="muted-note">Файл CSV или JSON с колонками title, category, price, stock. Товар с известным артикулом обновляется, новый добавляется. Образец - кнопка «Экспорт CSV».</p>

      {importReport && (
        <div className="import-report" role="status">
          <p><strong>Загрузка завершена.</strong> Добавлено: {importReport.added}. Обновлено: {importReport.updated}. Пропущено строк: {importReport.errors.length}.</p>
          {importReport.errors.length > 0 && (
            <ul className="import-report__list">
              {importReport.errors.slice(0, 5).map((e) => (
                <li key={e.line}>Строка {e.line}: {e.error}</li>
              ))}
              {importReport.errors.length > 5 && <li>и ещё {importReport.errors.length - 5}</li>}
            </ul>
          )}
          <button type="button" className="link-btn" onClick={() => setImportReport(null)}>Скрыть</button>
        </div>
      )}

      <div className="admin__filters">
        <TextField className="admin__search" label="Поиск по названию или артикулу" value={filters.q} onChange={setFilter('q')} />
        <SelectField label="Категория" value={filters.category} onChange={setFilter('category')} placeholder="Все" options={CATEGORIES.map((c) => ({ value: c.slug, label: c.title }))} />
        <SelectField label="Наличие" value={filters.stock} onChange={setFilter('stock')} placeholder="Все" options={[{ value: 'in', label: 'В наличии' }, { value: 'out', label: 'Нет в наличии' }]} />
        <SelectField label="Публикация" value={filters.publish} onChange={setFilter('publish')} placeholder="Все" options={[{ value: 'on', label: 'На сайте' }, { value: 'off', label: 'Скрыты' }]} />
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <div style={{ textAlign: 'center' }}><Spinner /></div>
      ) : !filtered.length ? (
        <EmptyState icon="search" title="Товары не найдены" text="Измените поиск или фильтры" />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">Список товаров</caption>
              <thead>
                <tr><th scope="col">Фото</th><th scope="col">Название</th><th scope="col">Артикул</th><th scope="col">Категория</th><th scope="col">Цена</th><th scope="col">Остаток</th><th scope="col">На сайте</th><th scope="col">Действия</th></tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Фото"><span className="table__thumb"><ProductImage product={p} label="Фото" iconSize={16} /></span></td>
                    <td data-label="Название">{p.title}</td>
                    <td data-label="Артикул">{p.sku}</td>
                    <td data-label="Категория">{getCategory(p.category)?.title}</td>
                    <td data-label="Цена">{formatPrice(p.finalPrice)}</td>
                    <td data-label="Остаток">{p.stock}</td>
                    <td data-label="На сайте"><span className={`tag ${p.published ? 'tag--on' : ''}`}>{p.published ? 'Вкл' : 'Выкл'}</span></td>
                    <td data-label="Действия">
                      <div className="table__actions">
                        <button type="button" className="link-btn" onClick={() => openForm(p)} aria-label={`Изменить «${p.title}»`}>Изменить</button>
                        <button type="button" className="link-btn link-btn--danger" onClick={() => setToDelete(p)} aria-label={`Удалить «${p.title}»`}>Удалить</button>
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

      <h2 className="admin__h2">Карточка товара: добавление и редактирование</h2>
      <form className="panel admin__form" onSubmit={save} noValidate ref={formRef} aria-label="Карточка товара">
        <p className="muted-note">{form.id ? `Редактирование товара № ${String(form.id).padStart(6, '0')}` : 'Новый товар'}</p>
        <div className="admin__cols">
          <div className="admin__col">
            <TextField label="Название" required value={form.title} error={errors.title} maxLength={120} onChange={(e) => setF('title', e.target.value)} />
            <SelectField label="Категория" required value={form.category} error={errors.category} placeholder="Выберите категорию" options={CATEGORIES.map((c) => ({ value: c.slug, label: c.title }))} onChange={(e) => setF('category', e.target.value)} />
            <div className="panel__row">
              <TextField label="Артикул" value={form.sku} hint="Пусто - присвоится автоматически" maxLength={20} onChange={(e) => setF('sku', e.target.value)} />
              <TextField label="Остаток, шт." inputMode="numeric" value={form.stock} error={errors.stock} onChange={(e) => setF('stock', e.target.value.replace(/\D/g, ''))} />
            </div>
            <div className="panel__row">
              <TextField label="Цена, ₽" required inputMode="decimal" value={form.price} error={errors.price} onChange={(e) => setF('price', e.target.value.replace(/[^\d.,]/g, ''))} />
              <TextField label="Скидка, %" inputMode="numeric" value={form.discount} error={errors.discount} onChange={(e) => setF('discount', e.target.value.replace(/\D/g, '').slice(0, 2))} />
            </div>
            <TextField label="Описание" multiline rows={5} value={form.description} maxLength={3000} onChange={(e) => setF('description', e.target.value)} />
          </div>
          <div className="admin__col">
            <div className="admin__photo">
              {form.image && !errors.image ? <ProductImage product={{ title: form.title || 'Фото', images: [form.image] }} label="Фото товара" iconSize={28} /> : <PhotoPlaceholder label="Фото товара" iconSize={28} />}
              <TextField label="Ссылка на изображение" value={form.image} error={errors.image} placeholder="https://… или /images/файл.jpg" onChange={(e) => setF('image', e.target.value)} />
            </div>
            <fieldset className="admin__specs">
              <legend>Характеристики</legend>
              {form.specs.map((s, i) => (
                <div className="panel__row" key={i}>
                  <TextField label="Название" value={s[0]} maxLength={60} onChange={(e) => setSpec(i, 0, e.target.value)} />
                  <TextField label="Значение" value={s[1]} maxLength={120} onChange={(e) => setSpec(i, 1, e.target.value)} />
                </div>
              ))}
              {form.specs.length < 12 && (
                <button type="button" className="link-btn" onClick={() => setF('specs', [...form.specs, ['', '']])}>+ Добавить характеристику</button>
              )}
            </fieldset>
            <Checkbox label="Показывать на сайте" checked={form.published} onChange={(e) => setF('published', e.target.checked)} />
            <div className="panel__row panel__row--actions">
              <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? 'Сохраняем…' : 'Сохранить'}</button>
              <button type="button" className="btn btn--outline" onClick={() => { setForm(EMPTY); setErrors({}) }}>Отмена</button>
            </div>
          </div>
        </div>
      </form>

      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Удалить товар?" size="sm">
        <p>Товар «{toDelete?.title}» будет удалён. Это действие нельзя отменить.</p>
        <div className="modal__actions">
          <button type="button" className="btn btn--outline" onClick={() => setToDelete(null)}>Отмена</button>
          <button type="button" className="btn btn--danger" onClick={confirmDelete}>Удалить</button>
        </div>
      </Modal>
    </>
  )
}
