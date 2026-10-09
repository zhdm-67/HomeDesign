import { pool } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function calcTotals(items) {
  let total = 0;
  let count = 0;
  for (const it of items) {
    const price = Number(it.price) || 0;
    const qty = Math.max(1, parseInt(it.qty, 10) || 1);
    total += price * qty;
    count += qty;
  }
  return { total, count };
}

// GET /api/projects — список проектов текущего пользователя
export const listProjects = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.room_type, p.preview_image, p.total_price, p.items_count,
            p.created_at, p.updated_at, s.slug AS style_slug, s.name AS style_name
     FROM projects p
     JOIN styles s ON s.id = p.style_id
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC`,
    [req.user.id]
  );

  res.json({
    projects: rows.map(p => ({
      id: p.id,
      name: p.name,
      roomType: p.room_type,
      style: p.style_name,
      styleSlug: p.style_slug,
      previewImage: p.preview_image,
      totalPrice: Number(p.total_price),
      itemsCount: p.items_count,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    })),
  });
});

// GET /api/projects/:id — полный проект с предметами
export const getProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [projects] = await pool.query(
    `SELECT p.*, s.slug AS style_slug, s.name AS style_name
     FROM projects p
     JOIN styles s ON s.id = p.style_id
     WHERE p.id = ? AND p.user_id = ?`,
    [id, req.user.id]
  );
  if (projects.length === 0) throw new ApiError(404, 'Проект не найден');

  const p = projects[0];
  const [items] = await pool.query(
    'SELECT id, catalog_item_id, name, price, quantity, image_url FROM project_items WHERE project_id = ? ORDER BY id',
    [id]
  );

  res.json({
    project: {
      id: p.id,
      name: p.name,
      roomType: p.room_type,
      styleId: p.style_id,
      styleSlug: p.style_slug,
      style: p.style_name,
      previewImage: p.preview_image,
      totalPrice: Number(p.total_price),
      itemsCount: p.items_count,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      items: items.map(i => ({
        id: i.id,
        catalogItemId: i.catalog_item_id,
        name: i.name,
        price: Number(i.price),
        qty: i.quantity,
        image: i.image_url,
      })),
    },
  });
});

// POST /api/projects — создать проект
export const createProject = asyncHandler(async (req, res) => {
  const { name, roomType = 'Гостиная', styleId, previewImage, items = [] } = req.body;

  if (!name?.trim()) throw new ApiError(400, 'Название обязательно');
  if (!styleId) throw new ApiError(400, 'Не указан стиль');
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'Проект должен содержать хотя бы один предмет');
  }

  const [styleRows] = await pool.query('SELECT id FROM styles WHERE id = ?', [styleId]);
  if (styleRows.length === 0) throw new ApiError(400, 'Стиль не найден');

  const { total, count } = calcTotals(items);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO projects (user_id, name, room_type, style_id, preview_image, total_price, items_count)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, name.trim(), roomType, styleId, previewImage || null, total, count]
    );
    const projectId = result.insertId;

    const values = items.map(it => [
      projectId,
      it.catalogItemId || it.id || null,
      it.name || 'Без названия',
      Number(it.price) || 0,
      Math.max(1, parseInt(it.qty, 10) || 1),
      it.image || null,
    ]);
    await conn.query(
      'INSERT INTO project_items (project_id, catalog_item_id, name, price, quantity, image_url) VALUES ?',
      [values]
    );

    await conn.commit();
    res.status(201).json({ id: projectId, totalPrice: total, itemsCount: count });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// PUT /api/projects/:id — обновить проект
export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, roomType, previewImage, items } = req.body;

  const [owned] = await pool.query(
    'SELECT id FROM projects WHERE id = ? AND user_id = ?',
    [id, req.user.id]
  );
  if (owned.length === 0) throw new ApiError(404, 'Проект не найден');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let total = null;
    let count = null;

    // Если пришли новые items — заменяем всё содержимое и пересчитываем
    if (Array.isArray(items)) {
      if (items.length === 0) {
        throw new ApiError(400, 'Проект не может быть пустым');
      }

      const totals = calcTotals(items);
      total = totals.total;
      count = totals.count;

      await conn.query('DELETE FROM project_items WHERE project_id = ?', [id]);

      const values = items.map((item) => [
        id,
        item.catalogItemId ? Number(item.catalogItemId) : null,
        String(item.name || 'Без названия').slice(0, 200),
        Number(item.price) || 0,
        Math.max(1, parseInt(item.qty, 10) || 1),
        String(item.image || '').slice(0, 1000),
      ]);

      await conn.query(
        'INSERT INTO project_items (project_id, catalog_item_id, name, price, quantity, image_url) VALUES ?',
        [values]
      );
    }

    const updates = [];
    const params = [];
    if (name !== undefined)         { updates.push('name = ?');          params.push(String(name).trim()); }
    if (roomType !== undefined)     { updates.push('room_type = ?');     params.push(roomType); }
    if (previewImage !== undefined) { updates.push('preview_image = ?'); params.push(previewImage); }
    if (total !== null)             { updates.push('total_price = ?');   params.push(total); }
    if (count !== null)             { updates.push('items_count = ?');   params.push(count); }

    if (updates.length > 0) {
      params.push(id);
      await conn.query(
        `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    await conn.commit();
    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// DELETE /api/projects/:id
export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [result] = await pool.query(
    'DELETE FROM projects WHERE id = ? AND user_id = ?',
    [id, req.user.id]
  );
  if (result.affectedRows === 0) throw new ApiError(404, 'Проект не найден');
  res.json({ ok: true });
});