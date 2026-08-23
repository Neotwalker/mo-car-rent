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
