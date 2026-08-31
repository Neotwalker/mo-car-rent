# Stage 11 - Catalog UX v9

- Type cards compacted: heading on top; 28px vehicle icon + live count centered in one row.
- Removed the "Уточнить место" control and its popover from catalog markup.
- Card image preview is capped at 5 preview slides. If CMS supplies more than 5 images, slide 5 gets a dark `Ещё N фото` overlay while the full gallery remains available on car single.
- Added smart faceted availability: impossible type/fuel/transmission/drive checkboxes and select options become disabled based on the current pending filter combination. Counts refresh live.
- Custom select portal mirrors disabled native options and keyboard navigation skips unavailable values.
