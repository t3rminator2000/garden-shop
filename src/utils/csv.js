// Разбор и сборка CSV. Разделитель - точка с запятой: так файл открывает Excel с русской локалью.
// Кавычки по правилам CSV: внутри поля они удваиваются.

export function parseCsv(text, sep = ';') {
  const src = String(text || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n')
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let i = 0; i < src.length; i += 1) {
    const c = src[i]
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        field += c
      }
      continue
    }
    if (c === '"' && !field) {
      quoted = true
    } else if (c === sep) {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += c
    }
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((v) => String(v).trim()))
}

// Превращает CSV в массив объектов по строке заголовка
export function csvToObjects(text, sep = ';') {
  const rows = parseCsv(text, sep)
  if (rows.length < 2) return []
  const head = rows[0].map((h) => h.trim().toLowerCase())
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])))
}

const cell = (v) => {
  const s = v === null || v === undefined ? '' : String(v)
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(rows, columns, sep = ';') {
  const head = columns.join(sep)
  const body = rows.map((r) => columns.map((c) => cell(r[c])).join(sep))
  // BOM нужен, чтобы Excel открыл файл в UTF-8 без крякозябр
  return `﻿${[head, ...body].join('\r\n')}\r\n`
}

// Скачивание строки файлом, без сервера
export function downloadText(filename, text, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
