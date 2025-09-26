const tenantModel = require('../models/tenant.model');
const path = require('path');

const getTenants = async (req, res) => {
  try {
    const tenants = await tenantModel.findAll();
    res.json({ code: 200, message: '获取成功', data: tenants });
  } catch (error) {
    console.error('获取账套错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
};

const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await tenantModel.findById(id);
    if (!tenant) return res.status(404).json({ code: 404, message: '账套不存在', data: null });
    res.json({ code: 200, message: '获取成功', data: tenant });
  } catch (error) {
    console.error('获取账套错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
};

const createTenant = async (req, res) => {
  try {
    const data = req.body;
    // 简单校验
    if (!data.name || !data.code) {
      return res.status(400).json({ code: 400, message: 'name and code are required', data: null });
    }
    const newTenant = await tenantModel.create(data);
    res.status(201).json({ code: 201, message: '创建成功', data: newTenant });
  } catch (error) {
    console.error('创建账套错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
};

const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updated = await tenantModel.update(id, data);
    if (!updated) return res.status(404).json({ code: 404, message: '账套不存在', data: null });
    res.json({ code: 200, message: '更新成功', data: updated });
  } catch (error) {
    console.error('更新账套错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
};

const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await tenantModel.remove(id);
    if (!ok) return res.status(404).json({ code: 404, message: '账套不存在', data: null });
    res.json({ code: 200, message: '删除成功', data: null });
  } catch (error) {
    console.error('删除账套错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
};

module.exports = {
  getTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant
};
