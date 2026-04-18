import express from 'express';
import {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
} from '../controllers/productController.js';

const router = express.Router();

router.get('/', getProducts);
router.post('/', createProduct);
router.get('/:id', getProductById);
router.patch('/:id', updateProduct);

export default router;
