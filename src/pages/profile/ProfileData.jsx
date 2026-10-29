import { useState } from 'react'
import { SelectField, TextField } from '../../components/Fields'
import { authApi } from '../../api'
import { REGIONS } from '../../constants'
import { useAuth } from '../../context/AuthContext'
import { useUI } from '../../context/UIContext'
import { formatPhone, validateIndex, validateName, validatePhone } from '../../utils/validators'

// Данные и адреса: имя, телефон и адрес по умолчанию. Они подставляются при оформлении заказа.
export default function ProfileData() {
  const { user, updateProfile } = useAuth()
  const { showToast } = useUI()
  const saved = authApi.getProfile(user.key)
  const [form, setForm] = useState({
    name: user.name || '',
    phone: formatPhone(user.phone || ''),
    region: REGIONS.some((r) => r.name === saved.address.region) ? saved.address.region : REGIONS[0].name,
    index: saved.address.index,
    city: saved.address.city,
    street: saved.address.street,
    house: saved.address.house,
    flat: saved.address.flat,
  })
  const [errors, setErrors] = useState({})
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    const next = { name: validateName(form.name), phone: validatePhone(form.phone, { required: false }), index: validateIndex(form.index) }
    setErrors(next)
    if (Object.values(next).some(Boolean)) {
      setTimeout(() => e.target.querySelector('[aria-invalid="true"]')?.focus(), 0)
      return
    }
    updateProfile(user.key, {
      name: form.name.trim(),
      phone: form.phone,
      address: { region: form.region, index: form.index.trim(), city: form.city.trim(), street: form.street.trim(), house: form.house.trim(), flat: form.flat.trim() },
    })
    showToast('Данные сохранены', 'success')
  }

  return (
    <section aria-labelledby="data-title">
      <h2 id="data-title" className="section__title section__title--sm">Данные и адреса</h2>
      <form className="panel panel--narrow" onSubmit={submit} noValidate>
        <h3 className="panel__title">Контакты</h3>
        <TextField label="Имя" value={form.name} error={errors.name} autoComplete="name" maxLength={80} onChange={(e) => set('name', e.target.value)} />
        <div className="panel__row">
          <TextField label="E-mail" value={user.email} readOnly hint="Адрес менять нельзя" />
          <TextField label="Телефон" type="tel" autoComplete="tel" value={form.phone} error={errors.phone} onChange={(e) => set('phone', formatPhone(e.target.value))} />
        </div>
        <h3 className="panel__title">Адрес доставки</h3>
        <SelectField label="Регион" value={form.region} options={REGIONS.map((r) => ({ value: r.name, label: r.name }))} onChange={(e) => set('region', e.target.value)} />
        <div className="panel__row">
          <TextField label="Индекс" inputMode="numeric" maxLength={6} value={form.index} error={errors.index} onChange={(e) => set('index', e.target.value.replace(/\D/g, ''))} />
          <TextField label="Город" value={form.city} maxLength={60} onChange={(e) => set('city', e.target.value)} />
        </div>
        <TextField label="Улица" value={form.street} maxLength={80} onChange={(e) => set('street', e.target.value)} />
        <div className="panel__row">
          <TextField label="Дом" value={form.house} maxLength={10} onChange={(e) => set('house', e.target.value)} />
          <TextField label="Квартира" value={form.flat} maxLength={10} onChange={(e) => set('flat', e.target.value)} />
        </div>
        <div><button type="submit" className="btn btn--primary">Сохранить</button></div>
      </form>
    </section>
  )
}
