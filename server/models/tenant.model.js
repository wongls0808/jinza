// 简单的内存模型用于开发与测试
const { v4: uuidv4 } = require('uuid');

let tenants = [
  {
    id: 't1',
    name: '账套 A',
    code: 'A001',
    registerNo: 'R-A',
    taxNo: 'T-A',
    phone: '13800000000',
    email: 'a@example.com',
    address: '地址A',
    logoData: null,
    sealData: null,
    signatureData: null,
    templates: []
  }
];

const findAll = async (filters = {}) => {
  // 目前忽略 filters，直接返回全部
  return tenants;
};

const findById = async (id) => {
  return tenants.find(t => t.id === id) || null;
};

const create = async (data) => {
  const id = data.id || uuidv4();
  const newTenant = { ...data, id };
  tenants.push(newTenant);
  return newTenant;
};

const update = async (id, data) => {
  const idx = tenants.findIndex(t => t.id === id);
  if (idx === -1) return null;
  tenants[idx] = { ...tenants[idx], ...data, id };
  return tenants[idx];
};

const remove = async (id) => {
  const idx = tenants.findIndex(t => t.id === id);
  if (idx === -1) return false;
  tenants.splice(idx, 1);
  return true;
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove
};