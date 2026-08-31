# Stage 11 v12

- Popular models Swiper: edge clipping removed with inner padding + matching negative inline margin; scrollbar inset follows the same edge spacing.
- Catalog filter modal: true fullscreen layout at <=1024px, including small tablets, with safe-area aware header/footer.
- Homepage hero booking now submits real GET parameters to `cars/` instead of demo-blocking submission.
- Hero parameters use the same catalog contract: `pickup`, `return=same`, `pickup_date`, `return_date`.
- Catalog pickup options now understand `delivery` and `office`, so the hero selection is restored on `/cars/`.
