USE home_design;

-- Таблица пользователей
CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Таблица стилей интерьера
CREATE TABLE styles (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug            VARCHAR(50) NOT NULL UNIQUE,   -- 'scandinavian', 'loft'
  name            VARCHAR(100) NOT NULL,         -- 'Скандинавский'
  description     TEXT,                          -- Текст для инфо-баннера
  preview_image   VARCHAR(500) NOT NULL,         -- Большая картинка превью
  thumbnail       VARCHAR(500) NOT NULL,         -- Маленькая картинка для карточки
  display_order   INT DEFAULT 0,                 -- Порядок вывода
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Таблица каталога предметов
CREATE TABLE catalog_items (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  style_id     INT UNSIGNED NOT NULL,
  name         VARCHAR(200) NOT NULL,
  price        DECIMAL(10, 2) NOT NULL,          -- 89000.00
  image_url    VARCHAR(500) NOT NULL,
  description  TEXT,
  is_active    BOOLEAN DEFAULT TRUE,             -- можно скрыть предмет из каталога
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (style_id) REFERENCES styles(id) ON DELETE CASCADE,
  INDEX idx_style (style_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Таблица проектов пользователей
CREATE TABLE projects (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED NOT NULL,
  name           VARCHAR(200) NOT NULL,
  room_type      VARCHAR(50) NOT NULL DEFAULT 'Гостиная',
  style_id       INT UNSIGNED NOT NULL,          -- Выбранный стиль
  preview_image  VARCHAR(500),                   -- Дублируем для быстрого рендера списка
  total_price    DECIMAL(10, 2) DEFAULT 0,       -- Кешируем итог для быстрого списка
  items_count    INT UNSIGNED DEFAULT 0,         -- Кешируем количество
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (style_id) REFERENCES styles(id) ON DELETE RESTRICT,
  INDEX idx_user (user_id),
  INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Таблица предметов внутри проекта
CREATE TABLE project_items (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id       INT UNSIGNED NOT NULL,
  catalog_item_id  INT UNSIGNED,                 -- может стать NULL, если предмет удалили
  name             VARCHAR(200) NOT NULL,        -- дублируем, чтобы предмет не пропадал
  price            DECIMAL(10, 2) NOT NULL,      -- зафиксированная цена
  quantity         INT UNSIGNED NOT NULL DEFAULT 1,
  image_url        VARCHAR(500),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id)      REFERENCES projects(id)      ON DELETE CASCADE,
  FOREIGN KEY (catalog_item_id) REFERENCES catalog_items(id) ON DELETE SET NULL,
  INDEX idx_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;