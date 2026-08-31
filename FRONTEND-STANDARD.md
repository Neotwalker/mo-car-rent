# MO Car Rent Phuket - стандарт frontend-разработки

Версия: 1.1  
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

Шрифты через CDN в production запрещены. Базово используем системный sans-serif. Если позже утверждается фирменный web-font, файлы размещаются локально в теме WordPress и подключаются через `@font-face`.


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


---

## 24. Overflow и выпадающие компоненты

Секция не должна обрезать интерактивные popover/listbox элементы. Для hero визуальные слои обрезаются внутри `.hero__media`, а сама `.hero` сохраняет `overflow: visible`.

Запрещено исправлять crop фоновых изображений через `overflow: hidden` на общем контейнере, если внутри него есть dropdown, tooltip, popover или modal trigger.

---

## 25. Динамический Google rating

Текущие rating/review count должны иметь серверный fallback в HTML и возможность обновления.

Рекомендуемая production-схема:

1. WordPress хранит Google Place ID в options/ACF Options.
2. Серверный код получает `rating` и `userRatingCount` из Google Places API.
3. Ответ кэшируется через transient минимум на несколько часов, чтобы не делать API-запрос на каждый просмотр страницы.
4. Шаблон hero рендерит последнее сохранённое значение сервером.
5. Опциональный REST endpoint `/wp-json/mocar/v1/google-rating` может обновлять уже открытый интерфейс.
6. При ошибке API сайт показывает последнее кэшированное значение, а не пустой блок.
7. Не размещать unrestricted Google API key в frontend JS.


---

## 26. Header / burger navigation

При ширине viewport меньше `1200px` desktop-навигация переключается в burger-menu.

Эталон:

```html
<button
  class="menu-toggle"
  type="button"
  aria-label="Открыть меню"
  aria-controls="main-navigation"
  aria-expanded="false"
  data-menu-toggle
>
  ...
</button>

<nav id="main-navigation" data-main-nav>
  ...
</nav>
```

Правила:

- используется тот же `<nav>`, а не второй дублирующий набор ссылок;
- состояние хранится через `aria-expanded`;
- открытое меню получает `.is-open`;
- при открытии блокируется scroll `body`;
- `Escape` закрывает меню;
- переход по ссылке закрывает меню;
- при возврате на desktop меню сбрасывается;
- JS hook - только `data-*`, UI классы не используются как селекторы логики.

---

## 27. Mobile hero media

На телефонах (`<=700px`) desktop scenic-background отключается полностью.

Вместо фонового media-layer используется отдельное декоративное изображение внутри контентного потока:

```html
<figure class="hero__mobile-visual" aria-hidden="true">
  <img src="assets/hero-bg-mob.png" alt="">
</figure>
```

Правила:

- изображение находится в DOM сразу после hero lead;
- оно не является CSS background;
- `alt=""`, так как смысл страницы не зависит от декоративной машины;
- изображение можно выводить через WordPress attachment ID;
- для выхода изображения до краёв viewport используется отрицательный margin, равный `--container-gutter`;
- mobile hero не должен иметь фиксированный `min-height`, который создаёт пустое пространство;
- `hero__proof` на телефоне остаётся в нормальном document flow без искусственных `margin-top: 200px+`.

---

## 28. Чистота production-архива

В архив, который передаётся как рабочая версия сайта, входят только файлы, необходимые для запуска, разработки и дальнейшей интеграции.

Запрещено включать:

- `*-NOTES.md`, `STAGE*-NOTES.md` и другие журналы итераций;
- временные QA-скриншоты;
- тестовые crop-файлы и дубли изображений;
- одноразовые build/debug-скрипты, если они не являются частью штатной сборки;
- локальные дампы и временные экспортированные данные.

В корне допускаются `README.md` и `FRONTEND-STANDARD.md`. История правок хранится в Git, а не в production-архиве.

---

## 29. Apple / Safari / WebKit

Safari на iPhone, iPad и macOS не должен менять согласованный UI системным синим цветом, нативной стрелкой или внутренней разметкой form controls.

Для проектных кнопок, triggers и кастомных controls явно задавать:

```css
.ui-control,
button.ui-control {
  -webkit-appearance: none;
  appearance: none;
  font: inherit;
  color: inherit;
  -webkit-text-fill-color: currentColor;
}

.ui-control svg {
  fill: none;
  stroke: currentColor;
}
```

Правила:

- не полагаться на browser-default `color` у `button`, `select`, `summary` и date controls;
- SVG-иконки используют `currentColor`, но цвет родителя всегда задаётся явно;
- для нативного `input[type="date"]` на Apple не полагаться на выравнивание `::-webkit-date-and-time-value`;
- если нужен одинаковый визуальный текст даты, native input остаётся функциональным слоем, а отображаемое значение рендерится отдельным label/pseudo-layer и синхронизируется JS;
- пустая дата должна иметь проектный placeholder, а не зависеть от того, показывает ли его Safari;
- проверять минимум iPhone Safari, iPad Safari и macOS Safari перед релизом формы.

---

## 30. Единый компонент параметров аренды

Получение, возврат и период аренды должны использовать один интерфейс и один контракт данных во всех точках сайта: hero, каталог и первый шаг заявки на странице автомобиля.

Базовые поля:

```text
pickup
return
pickup_date
return_date
```

Правила:

- получение и возврат - отдельные controls;
- возврат поддерживает значение `same`;
- даты выбираются одним range-picker, а не двумя визуально независимыми календарями;
- desktop range-picker показывает два месяца, mobile - один;
- выбранный период отображается одной компактной строкой;
- при переходе между страницами контекст аренды можно передавать через query string и восстанавливать без повторного ввода;
- на странице автомобиля первый шаг quiz использует тот же сценарий и названия полей, что каталог;
- не создавать отдельный второй UX для тех же данных.

---

## 31. Popover, modal и fullscreen sheet

Desktop dropdown/popover может быть привязан к trigger. На телефонах сложный выбор места и фильтры открываются как fullscreen sheet.

Обязательно:

- отдельная кнопка закрытия;
- `aria-expanded`/`aria-haspopup` у trigger;
- блокировка background scroll только пока fullscreen sheet открыт;
- `Escape` на desktop;
- safe-area через `env(safe-area-inset-*)`;
- закрытие возвращает focus к trigger;
- modal footer не должен перекрывать dropdown.

Кастомные listbox внутри scroll/modal-контейнера, если им не хватает места, рендерятся portal-слоем относительно viewport. Нельзя решать перекрытие случайным `z-index`, если родитель создаёт clipping/stacking context.

---

## 32. Фильтры каталога

Фильтр - progressive enhancement над реальными данными каталога.

Требования:

- тип авто, коробка, топливо, привод, места, марка, год, цена, объём двигателя и расход используют только доступные значения;
- невозможные комбинации пересчитываются после каждого изменения;
- option/checkbox, для которого после текущего набора фильтров нет автомобилей, получает `disabled` и визуально показывает недоступность;
- disabled option нельзя выбрать мышью, touch или клавиатурой;
- количество результатов обновляется до применения фильтров;
- active chips имеют отдельный `Сбросить`;
- на mobile filter dialog занимает весь экран и имеет sticky footer;
- select - кастомный listbox с native fallback по правилам раздела 10;
- типы автомобилей отображаются компактными cards: заголовок сверху, ниже icon + count; размер основной SVG-иконки около 28 px;
- не добавлять декоративные блоки фильтра, которые не влияют на подбор автомобиля.

---

## 33. Карточка автомобиля и media gallery

Карточка автомобиля не является целиком ссылкой. Переход на single выполняет явная CTA `Подробнее`.

Внутри карточки допустимы независимые действия:

- избранное;
- сравнение;
- управление media gallery.

Правила gallery:

- desktop: смена preview по положению курсора допустима как marketplace-паттерн;
- touch: swipe/drag;
- progress показывает доступные preview;
- если фотографий больше пяти, пятый preview показывает overlay `Ещё N фото` вместо вывода всех thumbnails;
- hover карточки не должен имитировать ссылку, если сама карточка не кликабельна;
- CTA, favorite и compare имеют отдельные hover/focus/active states;
- интерактивные иконки имеют `aria-label`, `aria-pressed` и tooltip на hover/focus.

---

## 34. Swiper и сторонние frontend-библиотеки

Swiper используется локально из `assets/vendor/` или эквивалентной папки темы. CDN в production не используется.

Правила:

- подключать только нужные bundle/assets;
- slider должен работать drag/swipe;
- navigation и scrollbar стилизуются проектом;
- крайние slides не обрезаются: внешний выход реализуется через согласованный внутренний padding и отрицательный margin, а не через случайный `overflow:hidden`;
- библиотека не должна блокировать основной контент при ошибке загрузки;
- обновление vendor-версии выполняется отдельно от UI-правок и проверяется на mobile/touch.

---

## 35. Избранное и сравнение

Избранное и сравнение в каталоге - режимы отображения текущего `catalog-grid`, а не отдельные страницы или модальные окна.

Правила:

- controls расположены рядом с результатами/сортировкой;
- счётчик виден в control;
- повторное нажатие возвращает полный каталог;
- на mobile используется тот же режим grid без отдельного плавающего блока;
- demo может хранить ID в `localStorage`;
- production-хранилище может быть заменено без изменения UI API;
- empty state объясняет, как добавить автомобиль;
- favorite и compare не должны ломать фильтры и сортировку.

---

## 36. Quiz заявки на странице автомобиля

Первый шаг заявки содержит единый компонент параметров аренды из раздела 30: получение, возврат и диапазон дат.

Остальные шаги могут включать:

1. страхование;
2. дополнительные услуги;
3. контакты и комментарий.

Правила:

- quiz не заменяет проверку доступности менеджером;
- переход `Далее` валидирует только текущий шаг;
- progress показывает реальный номер шага;
- success-state показывается поверх формы ограниченное время и не уводит пользователя на отдельную страницу без необходимости;
- формы сохраняют native validation/fallback;
- при доставке дополнительные адресные поля появляются только когда они реально нужны;
- место возврата хранится отдельно от места получения;
- demo-стоимости, страхование и дополнительные услуги явно не выдаются за подтверждённые условия бизнеса.

### Телефон

Телефон состоит из кода страны и национальной части:

- страна выбирается отдельно;
- маска и максимальная длина зависят от выбранного кода;
- ввод сверх допустимого количества цифр запрещён;
- скрытое поле хранит нормализованный полный номер;
- доступные WhatsApp/Telegram можно отметить чекбоксами как способы связи по этому номеру;
- нельзя хардкодить одну страну как единственный допустимый формат.



---

## Rental context в каталоге и квизе автомобиля

Поля контекста аренды используют один интерфейс и один контракт данных:

```text
pickup
return
pickup_date
return_date
```

Правила:

- на desktop в квизе автомобиля получение и возврат располагаются в первом ряду, диапазон дат - отдельным вторым рядом на всю ширину;
- на телефонах календарь диапазона дат открывается fullscreen и блокирует прокрутку страницы;
- fullscreen-календарь учитывает `safe-area`, имеет sticky header/footer и один календарный месяц;
- dropdown/popover внутри sticky-блоков не должен обрезаться родителем и обязан отображаться выше соседних секций;
- при открытом popover его stacking-context поднимается выше следующего контента страницы;
- закрытие по `Escape`, click outside и явной action-кнопке синхронизирует `aria-expanded` и scroll-lock.
