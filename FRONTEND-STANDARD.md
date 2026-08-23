# MO Car Rent Phuket - стандарт frontend-разработки

Версия: 1.0  
Назначение: единый технический стандарт для дальнейшей разработки сайта MO Car Rent Phuket. Документ нужен, чтобы новые экраны, компоненты и интеграция с WordPress собирались в одной системе и не требовали серии исправлений из-за разных подходов к HTML, CSS, JS, UI states и CMS.

---

## 1. Главный принцип

Сначала проектируется:

1. семантика и пользовательский сценарий;
2. модель данных и будущая CMS-структура;
3. responsive-layout;
4. UI kit и состояния компонентов;
5. только после этого декоративные стили.

Frontend не должен зависеть от конкретной длины текста, одного изображения, фиксированной цены или текущего количества автомобилей.

Код должен выдерживать замену контента через WordPress/ACF без перевёрстки блока.

---

## 2. Базовая структура проекта

```text
/
├── index.html
├── assets/
│   ├── style.css
│   ├── main.js
│   ├── logo.png
│   ├── icon-*.png
│   └── hero-*.png
└── FRONTEND-STANDARD.md
```

При переносе на WordPress:

```text
theme/
├── front-page.php
├── header.php
├── footer.php
├── functions.php
├── template-parts/
│   ├── hero.php
│   ├── car-card.php
│   ├── booking-form.php
│   └── ...
├── assets/
│   ├── css/
│   ├── js/
│   └── img/
└── inc/
    ├── acf.php
    ├── seo.php
    └── helpers.php
```

Компонент не должен хранить бизнес-данные внутри CSS или JS.

---

## 3. Container - единое правило ширины

Глобальный контейнер:

```css
:root {
  --container: 1920px;
  --container-gutter: clamp(24px, 2.5vw, 48px);
}

.container {
  width: min(
    calc(100% - (var(--container-gutter) * 2)),
    var(--container)
  ) !important;
  max-width: none !important;
  margin-inline: auto !important;
}
```

Правила:

- `.container` используется внутри секции, а не вместо секции;
- секция отвечает за фон, overflow и вертикальные отступы;
- `.container` отвечает только за горизонтальную рабочую область;
- внутренние блоки не создают собственные произвольные `max-width`, если это не часть композиции;
- на mobile меняется `--container-gutter`, а не переписывается контейнер.

Эталон:

```html
<section class="section" aria-labelledby="section-title">
  <div class="container">
    ...
  </div>
</section>
```

---

## 4. Семантика HTML

Ориентир по подходу - структура личного сайта MA: логичные landmark-элементы, один `main`, секции с заголовками, списки для наборов сущностей, реальные формы и ссылки вместо кликабельных `div`.

### Документ

```html
<header class="site-header">...</header>

<main id="main-content">
  <section aria-labelledby="hero-title">...</section>
  <section aria-labelledby="cars-title">...</section>
</main>

<footer class="site-footer">...</footer>
```

### Правила

- один `h1` на документ;
- последовательная иерархия `h1 -> h2 -> h3`;
- `section` получает заголовок или `aria-labelledby`;
- меню - `nav > ul > li > a`;
- набор преимуществ - `ul`, если это перечень равнозначных элементов;
- `dl` используется только для реальных пар «термин - описание»;
- кнопка выполняет действие;
- ссылка ведёт на URL/anchor;
- кликабельный `div` запрещён;
- декоративные изображения имеют `alt=""`;
- содержательные изображения получают нормальный `alt`;
- `aria-label` добавляется только там, где обычного текста недостаточно.

---

## 5. BEM и именование

Компоненты:

```text
.hero
.hero__content
.hero__actions
.hero__proof
.hero__proof-item

.button
.button--primary
.button--secondary

.booking
.booking__field
.booking__control
.booking__submit
```

Состояния:

```text
.is-active
.is-open
.is-loading
.is-disabled
.has-error
```

JS hooks:

```text
data-booking-form
data-modal-open
data-modal-close
data-filter
```

JS не должен зависеть от CSS-классов, предназначенных только для оформления.

Плохо:

```js
document.querySelector('.button--primary')
```

Хорошо:

```js
document.querySelector('[data-booking-form]')
```

---

## 6. Design tokens / UI kit

Основные параметры должны задаваться переменными.

```css
:root {
  --color-ink: #0e1417;
  --color-paper: #f6f1ec;
  --color-accent: #f4b400;
  --color-accent-hover: #ffc21a;
  --color-accent-active: #e8a900;

  --radius-sm: 10px;
  --radius-md: 12px;
  --radius-lg: 18px;

  --duration-fast: 160ms;
  --duration-base: 220ms;
  --ease-ui: cubic-bezier(.2,.7,.2,1);
}
```

Не создавать новые оттенки и радиусы в каждом блоке без причины.

---

## 7. Интерактивные состояния

У каждого кликабельного элемента должны быть:

1. default;
2. hover - только для устройств, где есть hover;
3. focus-visible;
4. active;
5. disabled, если состояние применимо.

### Hover

```css
@media (hover: hover) and (pointer: fine) {
  .button:hover {
    transform: translateY(-2px);
  }
}
```

Не применять hover-анимации на touch без необходимости.

### Focus

Нельзя отключать focus через `outline: none` без полноценной замены.

```css
.button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 4px;
}
```

### Active

```css
.button:active {
  transform: translateY(1px) scale(.995);
}
```

### Hit area

Иконки в header могут визуально быть 24-30 px, но кликабельная область должна быть около 44×44 px.

---

## 8. Кнопки

Основной API:

```html
<a class="button button--primary" href="/cars/">
  <span>Смотреть автомобили и цены</span>
  <span class="button__arrow" aria-hidden="true">→</span>
</a>
```

```html
<button class="button button--secondary" type="button">
  Подобрать другую модель
</button>
```

Правила:

- не фиксировать ширину родительского контента под одну кнопку;
- фиксированная ширина допустима только как UI-решение компонента и должна иметь responsive fallback;
- текст из WordPress может быть длиннее прототипа;
- `white-space: nowrap` допустим только на desktop, когда проверены все локализации;
- на mobile кнопка может занимать `width: 100%`;
- primary и secondary не должны иметь одинаковый визуальный вес.

---

## 9. Ссылки и навигация

Навигационные ссылки:

- без тяжёлых hover-анимаций;
- hover может быть underline/акцент;
- focus должен быть заметнее hover;
- активная страница отмечается через `aria-current="page"`.

Пример:

```html
<a class="main-nav__link" href="/cars/" aria-current="page">
  Автомобили
</a>
```

---

## 10. Формы

Обязательно:

- `form`;
- `label`;
- реальный `input/select/textarea`;
- `name`;
- `required`, где поле действительно обязательно;
- корректный `type`;
- native validation как базовый fallback;
- `aria-live` для динамического результата;
- `fieldset/legend`, когда поля составляют логическую группу.

Кастомный select допустим только как progressive enhancement:

- в HTML остаётся настоящий `<select>` как no-JS fallback и источник `name/value`;
- после инициализации JS появляется собственный trigger + `role="listbox"`;
- выбор синхронизируется обратно в native `<select>`;
- обязательны keyboard navigation, Escape, ArrowUp/ArrowDown, Home/End, Enter/Space, click outside;
- обязательны `aria-expanded`, `aria-selected`, focus management и error-state;
- CSS не должен полностью удалять native `<select>` до успешной инициализации JS.

Такой подход разрешён, если визуально native `<select>` не позволяет реализовать согласованный UI.

### Состояние поля

`focus-within` применяется к визуальной обёртке:

```css
.booking__control:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(255,190,0,.16);
}
```

Ошибка должна иметь:

- визуальное состояние;
- текст ошибки;
- программную связь с полем через `aria-describedby`.

---

## 11. JavaScript

### Принципы

- `defer`;
- strict mode;
- отсутствие inline JS;
- progressive enhancement;
- guard clauses;
- JS hooks через `data-*`;
- независимые функции/модули;
- одна ответственность у обработчика;
- DOM-элементы ищутся внутри компонента, а не глобально без причины.

### Эталон

```js
const initComponent = (root) => {
  const control = root.querySelector('[data-control]');
  if (!control) return;

  control.addEventListener('click', () => {
    ...
  });
};

document.querySelectorAll('[data-component]').forEach(initComponent);
```

### Custom Events

Связь компонента с аналитикой/WordPress-интеграцией лучше делать через события:

```js
document.dispatchEvent(
  new CustomEvent('mocar:booking:submit', {
    detail: formData
  })
);
```

Так UI не зависит напрямую от GA4/GTM/CRM.

---

## 12. WordPress / ACF

Контент hero не должен быть захардкожен в template.

Рекомендуемые поля:

```text
hero_label
hero_title
hero_text

hero_primary_button
  - title
  - url
  - target

hero_secondary_button
  - title
  - url
  - target

hero_background_desktop
hero_background_mobile
hero_car_image

hero_proof - repeater
  - type
  - title
  - text
  - icon

booking_note - repeater
  - text
```

В PHP:

- `esc_html()` для текста;
- `esc_url()` для URL;
- `wp_kses_post()` только для разрешённого rich text;
- не выводить ACF HTML без sanitization;
- изображения выводить через attachment ID, чтобы WordPress мог отдавать `srcset`/sizes.

Текст может быть короче или длиннее текущего прототипа. CSS обязан выдерживать изменение.

---

## 13. Каталог автомобилей

Карточка автомобиля должна быть отдельным компонентом и получать данные из модели/CPT.

Минимальная структура данных:

```text
brand
model
year
class
seats
transmission
fuel_type
price
deposit
insurance
minimum_rental
photos
delivery
features
```

Неподтверждённые цены, страховку, депозит или условия не хардкодить в шаблон.

---

## 14. Responsive

Подход mobile-first допустим, но breakpoints задаются по моменту поломки композиции, а не под конкретные модели устройств.

Пример текущей шкалы:

```text
> 1320 - full desktop
1181-1320 - compact desktop
701-1050 - tablet
<= 700 - mobile
```

Требуется проверка минимум:

```text
375
390
430
768
1024
1280
1440
1920
2048
2560
```

На 2K/4K контент не должен «разъезжаться» только потому, что viewport стал шире.

---

## 15. Изображения

- декоративный автомобиль может быть отдельным прозрачным слоем;
- фон и foreground не смешивать, если ими нужно управлять независимо;
- layout не должен зависеть от того, что объект всегда находится в одном пикселе изображения;
- использовать `object-position`;
- для ключевого LCP-изображения допустим `fetchpriority="high"`;
- остальные изображения lazy-load;
- WordPress должен генерировать WebP/AVIF, если инфраструктура это поддерживает.

---

## 16. Performance

Запрещено без необходимости:

- тяжёлый UI framework;
- большая animation library для простого hover;
- несколько шрифтовых семейств;
- внешний web-font без необходимости, если системный sans-serif решает задачу;
- видео/анимация в hero без оценки LCP;
- PNG/JPG в исходном многомегабайтном размере на production.

Проверять:

- LCP;
- CLS;
- INP;
- размер hero assets;
- preload только реально critical ресурсов.

---

## 17. Accessibility

Минимум:

- skip-link;
- keyboard navigation;
- `:focus-visible`;
- доступный contrast;
- touch target;
- labels;
- landmark-структура;
- `aria-current`;
- `aria-live`, где есть динамический результат;
- `prefers-reduced-motion`.

Нельзя использовать `aria-*` как замену нормальному HTML.

---

## 18. SEO markup

Для каждой индексируемой страницы:

- один понятный `h1`;
- структура заголовков по смыслу;
- реальные ссылки;
- отдельный URL;
- breadcrumbs на внутренних страницах;
- canonical;
- metadata;
- Schema.org только там, где данные реальны и поддерживаются содержимым страницы.

Не создавать скрытый SEO-текст ради ключевых слов.

---

## 19. Content resilience

Перед сдачей компонента заменить тестово:

- заголовок на +30% длиннее;
- CTA на +40% длиннее;
- описание на 3-4 строки;
- 4 преимущества вместо 3;
- телефон на другой формат;
- изображение с другим crop.

Если блок ломается - он не готов к CMS.

---

## 20. QA перед push

### HTML

- [ ] один `main`;
- [ ] один `h1`;
- [ ] корректная иерархия heading;
- [ ] нет кликабельных `div`;
- [ ] меню - список;
- [ ] формы имеют label/name/type;
- [ ] декоративные изображения имеют `alt=""`;
- [ ] нет лишнего ARIA.

### CSS

- [ ] используется `.container`;
- [ ] нет случайных magic numbers без причины;
- [ ] UI states есть у всех интерактивных элементов;
- [ ] `focus-visible` не отключён;
- [ ] hover находится под `(hover:hover)`;
- [ ] нет horizontal overflow;
- [ ] проверены 375 / 768 / 1440 / 1920 / 2048;
- [ ] проверена более длинная CMS-копия.

### JS

- [ ] нет inline scripts;
- [ ] JS использует `data-*`;
- [ ] есть guard clauses;
- [ ] нет глобальных переменных;
- [ ] компонент работает без ошибок, если optional DOM отсутствует;
- [ ] form validation не дублируется бессмысленно;
- [ ] события аналитики не зашиты непосредственно в UI-компонент.

### WordPress

- [ ] контент вынесен в поля;
- [ ] escaping/sanitization;
- [ ] изображения через attachment ID;
- [ ] шаблон не содержит временных бизнес-фактов;
- [ ] поля имеют defaults/fallbacks там, где это нужно.

---

## 21. Definition of Done для одного экрана

Экран считается готовым только после:

1. семантической HTML-разметки;
2. desktop + tablet + mobile;
3. hover/focus/active;
4. keyboard QA;
5. теста длинного CMS-контента;
6. проверки 1920/2048;
7. проверки формы;
8. проверки no-JS fallback, если применимо;
9. проверки Lighthouse/Core Web Vitals без очевидных регрессий;
10. одного визуального ревью перед push.

Цель - доводить компонент до устойчивого состояния до коммита, а не исправлять фундаментальные ошибки серией из десяти push.


---

## 22. Date input и календарная иконка

Для `input[type="date"]` используем нативный date picker, но визуально показываем только одну проектную иконку.

Правила:

- `type="date"` сохраняется ради мобильного UX и native picker;
- браузерный `::-webkit-calendar-picker-indicator` скрывается;
- рядом используется отдельный `button[type="button"]` с проектным SVG;
- JS вызывает `HTMLInputElement.showPicker()` при наличии API;
- при отсутствии `showPicker()` остаётся обычный нативный input как fallback;
- не строить собственный календарь без отдельной продуктовой причины.

---

## 23. Типографика

Базовый стек проекта должен быть sans-serif и не зависеть от внешней загрузки шрифта:

```css
--font-sans: "Segoe UI", Arial, Helvetica, sans-serif;
```

Если позже утверждается фирменный web-font, он добавляется отдельным решением после проверки:

- веса файлов;
- кириллицы;
- CLS/FOUT;
- LCP;
- лицензии;
- fallback metrics.
