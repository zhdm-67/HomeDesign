USE home_design;

-- Стили
INSERT INTO styles (slug, name, description, preview_image, thumbnail, display_order) VALUES
(
  'scandinavian',
  'Скандинавский',
  'Для скандинавского стиля доступны натуральные материалы и светлые оттенки',
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=200&h=120',
  1
),
(
  'loft',
  'Лофт',
  'Стиль лофт характеризуется грубыми фактурами, металлом и кирпичными стенами',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=200&h=120',
  2
);

-- Каталог предметов: Скандинавский
INSERT INTO catalog_items (style_id, name, price, image_url) VALUES
(1, 'Диван Нордик', 890.00, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=150&h=150'),
(1, 'Торшер Лайт', 125.00, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=150&h=150'),
(1, 'Журнальный столик Рунд', 249.00, 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&q=80&w=150&h=150');

-- Каталог предметов: Лофт
INSERT INTO catalog_items (style_id, name, price, image_url) VALUES
(2, 'Кожаный диван', 120.00, 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&q=80&w=150&h=150'),
(2, 'Металлический торшер', 180.00, 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80&w=150&h=150'),
(2, 'Деревянный кофейный столик', 320.00, 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&q=80&w=150&h=150');