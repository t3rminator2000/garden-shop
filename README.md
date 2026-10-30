# Сад и огород: клиентская часть интернет-магазина

Запуск (нужен Node 20.19 или новее и интернет):
  npm install
  npm run dev
Сборка: npm run build

Тестовые аккаунты
- Администратор: admin@garden.local / Admin2026
- Покупатель с заказами: demo@garden.local / Demo2026
- DummyJSON: emilys / emilyspass

Админ-панель
- Печать накладной: заказы, кнопка «Открыть», затем «Печать накладной».
- Импорт товаров: кнопка «Импорт из файла», формат CSV или JSON.
  Колонки: id, sku, title, category, sub, price, discount, stock, brand, published, image, description.
  В колонке image путь к фото: /images/000123.jpg или ссылка http и https.
  Товар с известным артикулом обновляется, остальные добавляются.
  Образец файла даёт кнопка «Экспорт CSV».
