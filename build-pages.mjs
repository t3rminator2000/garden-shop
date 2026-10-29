// Сборка для GitHub Pages. Запуск: npm run build:pages
// Адрес сайта на Pages выглядит как https://логин.github.io/имя-репозитория/,
// поэтому base должен совпадать с именем репозитория. На сервере GitHub имя берётся само,
// локально его можно задать так: npm run build:pages -- garden-shop
import { spawnSync } from 'node:child_process'
import { copyFileSync, writeFileSync } from 'node:fs'

const fromArg = process.argv[2]
const fromCI = process.env.GITHUB_REPOSITORY?.split('/')[1]
const repo = (fromArg || fromCI || '').replace(/^\/|\/$/g, '')
const base = repo ? `/${repo}/` : '/'

console.log(`Собираю для адреса ${base}`)
const res = spawnSync('npx', ['vite', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, VITE_BASE: base },
  shell: true,
})
if (res.status !== 0) process.exit(res.status ?? 1)

// На Pages нет сервера, который умеет отдавать index.html на любой адрес.
// Копия под именем 404.html решает это: внутренние ссылки вроде /catalog открываются напрямую.
copyFileSync('dist/index.html', 'dist/404.html')
// Пустой файл .nojekyll отключает обработку Jekyll, иначе часть файлов может не попасть на сайт
writeFileSync('dist/.nojekyll', '')
console.log('\nГотово. Папка dist готова к публикации на GitHub Pages.')
