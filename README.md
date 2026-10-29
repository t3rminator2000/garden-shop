# Сад и огород: клиентская часть интернет-магазина

Запуск (нужен Node 20.19 или новее и интернет):
  npm install
  npm run dev
Сборка: npm run build

Тестовые аккаунты
- Администратор: admin@garden.local / Admin2026
- Покупатель с заказами: demo@garden.local / Demo2026
- DummyJSON: emilys / emilyspass

Промокоды для проверки
- SAD10 - скидка 10 процентов на товары
- VESNA300 - скидка 300 рублей при сумме товаров от 2000 рублей
- DOSTAVKA - бесплатная доставка при сумме товаров от 1500 рублей

Сравнение товаров: кнопка со столбиками в карточке товара или на странице товара,
до четырёх позиций, ссылка «Сравнение» появляется в шапке.

Админ-панель
- Печать накладной: заказы, кнопка «Открыть», затем «Печать накладной».
- Импорт товаров: кнопка «Импорт из файла», формат CSV или JSON.
  Колонки: id, sku, title, category, sub, price, discount, stock, brand, published, description.
  Товар с известным артикулом обновляется, остальные добавляются.
  Образец файла даёт кнопка «Экспорт CSV».

Данные: товары в public/data/products.json, заказы в public/data/orders.json.
Корзина, избранное, сравнение, заказы, отзывы и правки админа хранятся в localStorage.
Фото: положи файлы в public/images и впиши путь в поле images товара.
Видео на главной: переменная VITE_HERO_VIDEO в файле .env, значение off отключает видео.

Публикация на GitHub Pages
1. Создай на github.com пустой репозиторий, например garden-shop, публичный, без README.
2. В папке проекта выполни:
   git init
   git add .
   git commit -m "Курсовой проект: клиентская часть интернет-магазина"
   git branch -M main
   git remote add origin https://github.com/ЛОГИН/garden-shop.git
   git push -u origin main
3. На GitHub открой Settings, раздел Pages, в Source выбери GitHub Actions.
4. Во вкладке Actions дождись, пока сборка позеленеет. Адрес сайта:
   https://ЛОГИН.github.io/garden-shop/
Дальше любой git push в ветку main обновляет сайт сам.

Версия для флешки, без интернета
   npm run build:offline
Папка dist копируется на флешку, сайт открывается двойным кликом по index.html.
