-- ============================================================
-- TerangaEats - Bakery external product images
-- Migration: 0007_bakery_external_images.sql
-- ============================================================
-- Uses CC0/public-domain Wikimedia Commons images so the app does
-- not depend on missing /product-images/* files.
-- Sources are linked directly through Wikimedia's file redirect.

update public.categories
set image_url = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Birthday_cake_2026.jpg',
    updated_at = now()
where id = 'cat-boulangerie';

update public.products
set image_url = case id
  when 'prod-gateau-anniversaire' then 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Birthday_cake_2026.jpg'
  when 'prod-pain-chocolat' then 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Pain_au_chocolat_-_Julien_Plumart_2026-08-14.jpg'
  when 'prod-croissant-jambon-fromage' then 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ham_%26_cheese_croissant_-_The_Flour_Pot_Bakery_2026-04-28.jpg'
  when 'prod-cake-vanille' then 'https://commons.wikimedia.org/wiki/Special:Redirect/file/VANILLA-CAKE.jpg'
  when 'prod-croissant-nature' then 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Croissant_bread.jpg'
  else image_url
end,
updated_at = now()
where id in (
  'prod-gateau-anniversaire',
  'prod-pain-chocolat',
  'prod-croissant-jambon-fromage',
  'prod-cake-vanille',
  'prod-croissant-nature'
);

select id, name_fr, price, image_url
from public.products
where id in (
  'prod-gateau-anniversaire',
  'prod-pain-chocolat',
  'prod-croissant-jambon-fromage',
  'prod-cake-vanille',
  'prod-croissant-nature'
)
order by name_fr;
