// Справочники магазина. Все значения в одном месте, чтобы страницы не дублировали их.

export const SHOP_NAME = 'Сад и огород'

export const CONTACTS = {
  phone: '+7 (000) 000-00-00',
  email: 'info@example.ru',
  hours: 'Пн-Пт, 9:00-18:00',
}

// Категории и подкатегории каталога (6 категорий из макета «Главная страница»)
export const CATEGORIES = [
  {
    slug: 'seeds-vegetables',
    title: 'Семена овощей',
    subs: [
      { slug: 'tomatoes', title: 'Томаты' },
      { slug: 'cucumbers', title: 'Огурцы' },
      { slug: 'peppers', title: 'Перец' },
      { slug: 'cabbage', title: 'Капуста' },
      { slug: 'roots', title: 'Морковь и свёкла' },
      { slug: 'greens', title: 'Зелень' },
      { slug: 'squash', title: 'Кабачки' },
    ],
  },
  {
    slug: 'seeds-flowers',
    title: 'Семена цветов',
    subs: [
      { slug: 'annuals', title: 'Однолетники' },
      { slug: 'perennials', title: 'Многолетники' },
    ],
  },
  {
    slug: 'saplings',
    title: 'Саженцы',
    subs: [
      { slug: 'berries', title: 'Ягодные' },
      { slug: 'fruit', title: 'Плодовые' },
      { slug: 'seedlings', title: 'Рассада овощей' },
    ],
  },
  {
    slug: 'fertilizers',
    title: 'Удобрения',
    subs: [
      { slug: 'vegetables', title: 'Для овощей' },
      { slug: 'universal', title: 'Универсальные' },
    ],
  },
  {
    slug: 'tools',
    title: 'Инструмент',
    subs: [
      { slug: 'hand', title: 'Ручной инструмент' },
      { slug: 'gloves', title: 'Перчатки' },
    ],
  },
  {
    slug: 'greenhouses',
    title: 'Теплицы и полив',
    subs: [
      { slug: 'watering', title: 'Полив' },
      { slug: 'cover', title: 'Укрытия' },
      { slug: 'seedling', title: 'Для рассады' },
    ],
  },
]

export const getCategory = (slug) => CATEGORIES.find((c) => c.slug === slug) || null
export const getSub = (catSlug, subSlug) =>
  getCategory(catSlug)?.subs.find((s) => s.slug === subSlug) || null

// Регионы. Коэффициент меняет стоимость доставки (макет: «зависит от региона»)
export const REGIONS = [
  { name: 'Москва', coef: 1 },
  { name: 'Санкт-Петербург', coef: 1 },
  { name: 'Московская область', coef: 1 },
  { name: 'Свердловская область', coef: 1.3 },
  { name: 'Кемеровская область', coef: 1.5 },
  { name: 'Новосибирская область', coef: 1.5 },
  { name: 'Краснодарский край', coef: 1.3 },
  { name: 'Республика Татарстан', coef: 1.2 },
]

// Способы доставки. cost - базовая цена для региона с коэффициентом 1
export const DELIVERY = [
  { id: 'post', title: 'Почта России', note: '3-7 дней', cost: 250, needsAddress: true },
  { id: 'pickup_point', title: 'Пункт выдачи', note: '', cost: 180, needsAddress: true },
  { id: 'office', title: 'Самовывоз из офиса', note: '', cost: 0, needsAddress: false },
  { id: 'courier', title: 'Курьер', note: '', cost: 450, needsAddress: true },
]
export const deliveryCost = (id, regionName) => {
  const d = DELIVERY.find((x) => x.id === id)
  const r = REGIONS.find((x) => x.name === regionName) || REGIONS[0]
  if (!d) return 0
  return Math.round((d.cost * r.coef) / 10) * 10
}

export const PAYMENTS = [
  { id: 'card', title: 'Картой онлайн', short: 'картой онлайн' },
  { id: 'sbp', title: 'СБП (по QR-коду)', short: 'через СБП' },
  { id: 'cod', title: 'При получении', short: 'при получении' },
]

// Статусы заказа. customer - как видит покупатель, admin - как видит администратор
export const ORDER_STATUS = {
  new: { admin: 'Новый', customer: 'В обработке' },
  processing: { admin: 'В обработке', customer: 'В обработке' },
  shipped: { admin: 'Отправлен', customer: 'Отправлен' },
  delivered: { admin: 'Доставлен', customer: 'Доставлен' },
  cancelled: { admin: 'Отменён', customer: 'Отменён' },
}
export const STATUS_FLOW = ['new', 'processing', 'shipped', 'delivered']

export const SORT_OPTIONS = [
  { value: 'popular', label: 'По популярности' },
  { value: 'price-asc', label: 'По цене: сначала дешёвые' },
  { value: 'price-desc', label: 'По цене: сначала дорогие' },
  { value: 'new', label: 'По новизне' },
]

export const PER_PAGE = 9
export const ADMIN_PER_PAGE = 6
export const ADMIN_ORDERS_PER_PAGE = 5

// Популярные запросы в поиске
export const POPULAR_QUERIES = ['огурец', 'перец', 'лейка', 'удобрение для томатов']

// «С этим товаром покупают» в корзине (макет «Страница корзины»)
export const CART_RECOMMENDED_IDS = [549, 550, 544, 530]

// Сопутствующий товар для блока «Похожие товары» (макет: к томатам идёт удобрение)
export const RELATED_BY_SUB = { tomatoes: 412, cucumbers: 413 }

// Промокоды магазина. percent - скидка в процентах, fixed - в рублях,
// delivery - бесплатная доставка. min - минимальная сумма товаров для кода.
export const PROMOCODES = [
  { code: 'SAD10', type: 'percent', value: 10, min: 0, title: 'Скидка 10% на товары' },
  { code: 'VESNA300', type: 'fixed', value: 300, min: 2000, title: 'Скидка 300 ₽ при заказе от 2000 ₽' },
  { code: 'DOSTAVKA', type: 'delivery', value: 0, min: 1500, title: 'Бесплатная доставка при заказе от 1500 ₽' },
]

// Сколько товаров разрешено держать в сравнении
export const COMPARE_MAX = 4

export const INFO_LINKS = [
  { slug: 'delivery', title: 'Доставка и оплата' },
  { slug: 'faq', title: 'Вопросы и ответы' },
  { slug: 'about', title: 'О магазине' },
]

// Ключи localStorage
export const LS = {
  cart: 'gs:cart',
  promo: 'gs:promo',
  compare: 'gs:compare',
  favorites: 'gs:favorites',
  viewed: 'gs:viewed',
  session: 'gs:session',
  users: 'gs:users',
  profiles: 'gs:profiles',
  orders: 'gs:orders',
  orderOverrides: 'gs:order-overrides',
  adminProducts: 'gs:admin-products',
  reviews: 'gs:reviews',
  questions: 'gs:questions',
  orderCounter: 'gs:order-counter',
}
