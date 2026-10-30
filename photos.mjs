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
const W = 800
const H = 600
const QUALITY = 85
const ALLOWED = ['.png', '.jpg', '.jpeg', '.webp', '.avif']
const CATEGORY_FILES = ['cat-seeds-vegetables', 'cat-seeds-flowers', 'cat-saplings', 'cat-fertilizers', 'cat-tools', 'cat-greenhouses']

const kb = (n) => `${Math.round(n / 1024)} КБ`

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
    // fit: cover - кадр заполняется целиком, лишнее обрезается симметрично от центра
    await sharp(src).resize(W, H, { fit: 'cover', position: 'centre' }).jpeg({ quality: QUALITY, mozjpeg: true }).toFile(join(OUT, outName))
    const res = await stat(join(OUT, outName))
    before += size
    after += res.size
    done += 1
    if (product) {
      product.images = [`/images/${outName}`]
      linked += 1
      console.log(`${file} -> ${outName}   ${kb(size)} -> ${kb(res.size)}   ${product.title}`)
    } else {
      console.log(`${file} -> ${outName}   ${kb(size)} -> ${kb(res.size)}   плитка категории`)
    }
  } catch (err) {
    failed += 1
    console.error(`${file}: не удалось обработать (${err.message})`)
  }
}

if (linked) await writeFile(DATA, `${JSON.stringify(products, null, 1)}\n`, 'utf8')

console.log(`\nГотово. Обработано: ${done}, привязано к товарам: ${linked}, не опознано: ${unknown}, с ошибкой: ${failed}.`)
if (done) console.log(`Вес: было ${kb(before)}, стало ${kb(after)}.`)
console.log('Фото подставятся сами, импорт каталога для этого не нужен.')
