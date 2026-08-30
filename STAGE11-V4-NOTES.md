# Stage 11 - Car single + Catalog interaction pass v4

Implemented after UX review:
- iOS date-input alignment fix while keeping native date picker and project trigger;
- phone country-code selector + country-aware national-number formatting and hard digit limits;
- WhatsApp / Telegram availability checkboxes instead of a required contact-method field;
- 4-step booking quiz: dates/pickup -> insurance -> extras -> contacts;
- success overlay for 6 seconds over the quiz;
- vehicle gallery with arrows, thumbnails and touch swipe on every car single;
- catalog card galleries with arrows, progress and touch swipe;
- favorites and comparison stored in localStorage;
- compare tray + comparison modal;
- demo-safe vehicle advantages;
- demo-safe insurance choices;
- extras: child seat, booster, southern provinces, islands (availability/price not claimed);
- popular-model horizontal rail with incremental loading;
- expanded catalog filters: brand, body type, seats, fuel, year, price and sorting;
- quick filter chips.

All insurance, extras, pricing and business terms remain demo/configurable data and must be replaced with buyer-confirmed values in WordPress/ACF.
