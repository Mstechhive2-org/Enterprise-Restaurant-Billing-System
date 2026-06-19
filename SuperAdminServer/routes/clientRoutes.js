import express from 'express';
import { getAllClients, createClient, updateClientPassword, validateLicense } from '../controllers/clientController.js';

const router = express.Router();

router.get('/', getAllClients);
router.post('/', createClient);
router.put('/:id/password', updateClientPassword);
router.post('/validate', validateLicense);

export default router;
