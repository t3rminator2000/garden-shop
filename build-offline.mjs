// Сборка версии «с флешки»: папка dist открывается двойным кликом по index.html,
// сервер и интернет не нужны. Запуск: npm run build:offline
import { spawnSync } from 'node:child_process'

const env = { ...process.env, VITE_BASE: './', VITE_ROUTER: 'hash', VITE_HERO_VIDEO: 'off' }
const res = spawnSync('npx', ['vite', 'build'], { stdio: 'inherit', env, shell: true })

if (res.status !== 0) process.exit(res.status ?? 1)
console.log('\nГотово. Папку dist можно скопировать на флешку и открыть index.html в браузере.')
