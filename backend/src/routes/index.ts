import { Router } from 'express';
import { health } from '../controllers/healthController.js';
import { listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';

const router = Router();

router.get('/health', health);

router.get('/customers', listCustomers);
router.get('/customers/:id', getCustomer);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);

export default router;
