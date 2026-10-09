import { Router } from 'express';
import { getAllStyles, getStyleBySlug } from '../controllers/stylesController.js';

const router = Router();

router.get('/', getAllStyles);
router.get('/:slug', getStyleBySlug);

export default router;