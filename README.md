# MO Car Rent Phuket - hero prototype

Файлы:
- `index.html` - семантическая разметка hero/header.
- `assets/style.css` - tokens, UI states, responsive layout.
- `assets/main.js` - booking form progressive enhancement.
- `FRONTEND-STANDARD.md` - эталонный frontend-стандарт для дальнейшей разработки и WordPress.

Текущий `data-demo` на форме отключает фактический переход после submit. При интеграции с WordPress удалите `data-demo` и задайте реальный action/обработчик.

Обновление v2:
- системный sans-serif без внешней зависимости;
- иконка телефона 22x22;
- accessible custom select с native select fallback;
- одна проектная иконка календаря поверх native date picker.

Обновление v3:
- удалены CDN-шрифты и исправлено наследование font-family;
- исправлен clipping custom select: overflow остаётся у media-слоя, а не у всей hero-секции;
- booking notes увеличены;
- Google rating оставлен с server-rendered fallback и подготовлен к обновлению через WordPress REST endpoint.

Обновление v4:
- burger-menu при ширине меньше 1200px;
- desktop hero media получает bleed через отрицательные container gutters на <=1050px;
- mobile hero без desktop background;
- mobile car image `hero-bg-mob.png` находится в HTML после lead;
- устранён большой искусственный отступ перед hero proof на телефонах.

## Stage 11 integration preview

The current archive includes the approved `car-card` visual direction integrated below the existing hero as `#cars`.
Component styles are isolated in `assets/catalog.css` and reuse the existing global design tokens without redefining `:root`, `body` or `.container`.
The demo card data is illustrative only and must be replaced by WordPress/ACF data later.
