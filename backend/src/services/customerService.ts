import { prisma } from '../config/prisma.js';

interface CustomerInput {
  name: string;
  email: string;
  phone?: string | null;
}

async function list() {
  return prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
}

async function get(id: number) {
  return prisma.customer.findUnique({ where: { id } });
}

async function create(data: CustomerInput) {
  return prisma.customer.create({ data });
}

async function update(id: number, data: CustomerInput) {
  return prisma.customer.update({ where: { id }, data });
}

async function remove(id: number) {
  return prisma.customer.delete({ where: { id } });
}

export const customerService = { list, get, create, update, remove };
