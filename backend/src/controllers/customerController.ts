import { Request, Response, NextFunction } from 'express';
import { customerService } from '../services/customerService.js';

export async function listCustomers(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await customerService.list();
    res.json(data);
  } catch (e) { next(e); }
}

export async function getCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const customer = await customerService.get(id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (e) { next(e); }
}

export async function createCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, phone } = req.body;
    const created = await customerService.create({ name, email, phone });
    res.status(201).json(created);
  } catch (e) { next(e); }
}

export async function updateCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { name, email, phone } = req.body;
    const updated = await customerService.update(id, { name, email, phone });
    res.json(updated);
  } catch (e) { next(e); }
}

export async function deleteCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await customerService.remove(id);
    res.status(204).send();
  } catch (e) { next(e); }
}
