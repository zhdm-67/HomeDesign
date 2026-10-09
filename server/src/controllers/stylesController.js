import { pool } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/styless
export const getAllStyles = asyncHandler(async (req, res) => {
  const [styles] = await pool.query(
    'SELECT id, slug, name, description, preview_image, thumbnail FROM styles ORDER BY display_order'
  );

  if (styles.length === 0) return res.json({ styles: [] });

  const styleIds = styles.map(s => s.id);
  const [items] = await pool.query(
    'SELECT id, style_id, name, price, image_url, description FROM catalog_items WHERE is_active = TRUE AND style_id IN (?) ORDER BY id',
    [styleIds]
  );

  const itemsByStyle = items.reduce((acc, item) => {
    (acc[item.style_id] ||= []).push({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      image: item.image_url,
      description: item.description,
    });
    return acc;
  }, {});

  const result = styles.map(s => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    infoText: s.description,
    previewImage: s.preview_image,
    thumbnail: s.thumbnail,
    catalog: itemsByStyle[s.id] || [],
  }));

  res.json({ styles: result });
});

// GET /api/styles/:slug
export const getStyleBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const [styles] = await pool.query(
    'SELECT id, slug, name, description, preview_image, thumbnail FROM styles WHERE slug = ?',
    [slug]
  );
  if (styles.length === 0) throw new ApiError(404, 'Стиль не найден');

  const style = styles[0];
  const [items] = await pool.query(
    'SELECT id, name, price, image_url, description FROM catalog_items WHERE style_id = ? AND is_active = TRUE ORDER BY id',
    [style.id]
  );

  res.json({
    style: {
      id: style.id,
      slug: style.slug,
      name: style.name,
      infoText: style.description,
      previewImage: style.preview_image,
      thumbnail: style.thumbnail,
      catalog: items.map(i => ({
        id: i.id,
        name: i.name,
        price: Number(i.price),
        image: i.image_url,
        description: i.description,
      })),
    },
  });
});