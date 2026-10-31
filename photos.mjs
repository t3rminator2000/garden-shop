// Подготовка фотографий. Запуск: npm run photos
//
// Берёт картинки из папки photos-src, приводит к 800 на 600, сохраняет в public/images
// как jpg и сам прописывает путь товару в public/data/products.json.
//
// Имя файла - это номер или артикул товара, оба варианта подходят:
//   123.png или 000123.png -> /images/000123.jpg у товара «Томат «Сибирский ранний»»
// Для плиток категорий на главной имена свои:
//   cat-seeds-vegetables, cat-seeds-flowers, cat-saplings, cat-fertilizers, cat-tools, cat-greenhouses
//
// Png с фотографией весит около 2 МБ, после обработки остаётся примерно 50 КБ.
import { readdir, mkdir, stat, readFile, writeFile } from 'node:fs/promises'
import { join, extname, basename } from 'node:path'
import sharp from 'sharp'

const SRC = 'photos-src'
const OUT = 'public/images'
const DATA = 'public/data/products.json'
// Карточка товара показывает кадр 4 к 3, плитка категории на главной - квадрат
const W = 800
const H = 600
const CATEGORY_W = 800
const CATEGORY_H = 800
const QUALITY = 85
const ALLOWED = ['.png', '.jpg', '.jpeg', '.webp', '.avif']
const CATEGORY_FILES = ['cat-seeds-vegetables', 'cat-seeds-flowers', 'cat-saplings', 'cat-fertilizers', 'cat-tools', 'cat-greenhouses']

const kb = (n) => `${Math.round(n / 1024)} КБ`

// Насколько кадр исходника может отличаться от нужного, чтобы обрезка не съела лишнее
const RATIO_TOLERANCE = 0.06
const PATCH = 40

// Средний цвет по четырём углам. Нужен, когда кадр не 4 к 3: поля заливаем
// цветом фона самой картинки, и стык не виден.
const edgeColor = async (file) => {
  const img = sharp(file)
  const { width, height } = await img.metadata()
  const size = Math.min(PATCH, Math.floor(width / 4), Math.floor(height / 4))
  const corners = [
    { left: 0, top: 0 },
    { left: width - size, top: 0 },
    { left: 0, top: height - size },
    { left: width - size, top: height - size },
  ]
  const sums = [0, 0, 0]
  let pixels = 0
  for (const c of corners) {
    const { data } = await sharp(file).extract({ ...c, width: size, height: size }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    for (let i = 0; i < data.length; i += 3) {
      sums[0] += data[i]
      sums[1] += data[i + 1]
      sums[2] += data[i + 2]
      pixels += 1
    }
  }
  if (!pixels) return { r: 20, g: 19, b: 16 }
  const [r, g, b] = sums.map((s) => Math.round(s / pixels))
  return { r, g, b }
}

// Кадр нужных пропорций обрезаем по центру, остальные вписываем целиком на фон их же цвета
const resizeOptions = async (file, ratio) => {
  const { width, height } = await sharp(file).metadata()
  if (!width || !height) throw new Error('не удалось прочитать размеры')
  if (Math.abs(width / height - ratio) <= RATIO_TOLERANCE) return { fit: 'cover', position: 'centre', mode: 'обрезка' }
  return { fit: 'contain', background: await edgeColor(file), mode: 'поля' }
}

let files = []
try {
  files = (await readdir(SRC)).filter((f) => ALLOWED.includes(extname(f).toLowerCase()))
} catch {
  console.error(`Папки ${SRC} нет. Создай её в корне проекта и положи туда картинки.`)
  process.exit(1)
}
if (!files.length) {
  console.error(`В папке ${SRC} нет картинок. Подходят форматы: ${ALLOWED.join(', ')}`)
  process.exit(1)
}

const products = JSON.parse(await readFile(DATA, 'utf8'))
await mkdir(OUT, { recursive: true })

// Ищем товар по имени файла: подходит и номер, и артикул
const findProduct = (name) => {
  const clean = name.trim()
  const digits = clean.replace(/\D/g, '')
  return products.find((p) => p.sku === clean || String(p.id) === clean || (digits && (p.sku === digits.padStart(6, '0') || String(p.id) === String(Number(digits)))))
}

let done = 0
let failed = 0
let unknown = 0
let linked = 0
let before = 0
let after = 0

for (const file of files.sort()) {
  const src = join(SRC, file)
  const name = basename(file, extname(file))
  const product = findProduct(name)
  const isCategory = CATEGORY_FILES.includes(name)

  if (!product && !isCategory) {
    unknown += 1
    console.warn(`${file}: не понял, какому товару это фото. Назови файл номером или артикулом, например 123.png`)
    continue
  }

  const outName = product ? `${product.sku}.jpg` : `${name}.jpg`
  try {
    const { size } = await stat(src)
    const [w, h] = isCategory ? [CATEGORY_W, CATEGORY_H] : [W, H]
    const { mode, ...fit } = await resizeOptions(src, w / h)
    await sharp(src).resize(w, h, fit).jpeg({ quality: QUALITY, mozjpeg: true }).toFile(join(OUT, outName))
    const res = await stat(join(OUT, outName))
    before += size
    after += res.size
    done += 1
    const label = product ? product.title : 'плитка категории'
    if (product) {
      product.images = [`/images/${outName}`]
      linked += 1
    }
    console.log(`${file} -> ${outName}   ${kb(size)} -> ${kb(res.size)}   ${mode}   ${label}`)
  } catch (err) {
    failed += 1
    console.error(`${file}: не удалось обработать (${err.message})`)
  }
}

if (linked) await writeFile(DATA, `${JSON.stringify(products, null, 1)}\n`, 'utf8')

console.log(`\nГотово. Обработано: ${done}, привязано к товарам: ${linked}, не опознано: ${unknown}, с ошибкой: ${failed}.`)
if (done) console.log(`Вес: было ${kb(before)}, стало ${kb(after)}.`)
console.log('Фото подставятся сами, импорт каталога для этого не нужен.')
