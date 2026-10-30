// Подготовка фотографий товаров. Запуск: npm run photos
//
// Берёт картинки из папки photos-src (png, jpg, webp), приводит их к одному размеру
// 800 на 600 и сохраняет в public/images в формате jpg. Имя файла не меняется,
// поэтому называй исходники по артикулу: 000123.png станет 000123.jpg.
//
// Png с фотографией весит около двух мегабайт, после обработки получается около 70 килобайт.
import { readdir, mkdir, stat } from 'node:fs/promises'
import { join, extname, basename } from 'node:path'
import sharp from 'sharp'

const SRC = 'photos-src'
const OUT = 'public/images'
const W = 800
const H = 600
const QUALITY = 85
const ALLOWED = ['.png', '.jpg', '.jpeg', '.webp', '.avif']

const kb = (n) => `${Math.round(n / 1024)} КБ`

let files = []
try {
  files = (await readdir(SRC)).filter((f) => ALLOWED.includes(extname(f).toLowerCase()))
} catch {
  console.error(`Папки ${SRC} нет. Создай её в корне проекта и положи туда картинки, имя файла - артикул товара.`)
  process.exit(1)
}

if (!files.length) {
  console.error(`В папке ${SRC} нет картинок. Подходят форматы: ${ALLOWED.join(', ')}`)
  process.exit(1)
}

await mkdir(OUT, { recursive: true })

let done = 0
let failed = 0
let before = 0
let after = 0

for (const file of files.sort()) {
  const src = join(SRC, file)
  const name = `${basename(file, extname(file))}.jpg`
  const out = join(OUT, name)
  try {
    const { size } = await stat(src)
    // fit: cover - кадр заполняется целиком, лишнее обрезается симметрично
    await sharp(src).resize(W, H, { fit: 'cover', position: 'centre' }).jpeg({ quality: QUALITY, mozjpeg: true }).toFile(out)
    const res = await stat(out)
    before += size
    after += res.size
    done += 1
    console.log(`${file} -> ${name}   ${kb(size)} -> ${kb(res.size)}`)
  } catch (err) {
    failed += 1
    console.error(`${file}: не удалось обработать (${err.message})`)
  }
}

console.log(`\nГотово. Обработано: ${done}, с ошибкой: ${failed}.`)
if (done) console.log(`Вес: было ${kb(before)}, стало ${kb(after)}.`)
console.log(`Файлы лежат в ${OUT}. Путь для колонки image в импорте: /images/имя.jpg`)
