# MO Car Rent Phuket - hero prototype

## Frontend structure
- Global `.container` is controlled by `--container` and `--container-gutter`.
- Header navigation uses `nav > ul > li > a`.
- Hero is a semantic `section` connected to its `h1` through `aria-labelledby`.
- Decorative media lives inside the hero `.container` and is excluded from the accessibility tree.
- Booking controls use real `label`, `input`, `select`, `fieldset` and `legend` elements.
- No inline JavaScript handlers are used.

## WordPress / ACF mapping
Recommended editable fields:
- hero identity;
- hero title;
- hero lead;
- primary and secondary CTA labels/URLs;
- hero proof items - Repeater;
- scene image and foreground car image;
- booking locations - Repeater or Options;
- booking notes - Repeater.

`assets/main.js` uses data attributes instead of content-dependent selectors. A WordPress implementation can listen for the `mocar:booking-submit` custom event or replace the prototype submit handler with the real catalog/filter request.
