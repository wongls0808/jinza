/**
 * 辅助工具 - 加密相关
 */
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/app.config');

/**
 * 生成随机字符串
 * @param {Number} length - 生成的字符串长度
 * @returns {String} - 随机字符串
 */
const generateRandomString = (length = 16) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

/**
 * 使用bcrypt哈希密码
 * @param {String} password - 原始密码
 * @returns {Promise} - 哈希后的密码
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, config.crypto.saltRounds);
};

/**
 * 验证密码
 * @param {String} password - 原始密码
 * @param {String} hashedPassword - 哈希后的密码
 * @returns {Promise} - 是否匹配
 */
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * 生成JWT访问令牌
 * @param {Object} payload - JWT负载
 * @returns {String} - JWT令牌
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    payload, 
    config.jwt.secret, 
    { expiresIn: config.jwt.accessTokenExpire }
  );
};

/**
 * 生成JWT刷新令牌
 * @param {Object} payload - JWT负载
 * @returns {String} - JWT令牌
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload, 
    config.jwt.secret, 
    { expiresIn: config.jwt.refreshTokenExpire }
  );
};

/**
 * 验证JWT令牌
 * @param {String} token - JWT令牌
 * @returns {Object} - 解码后的负载或null
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
};

/**
 * 验证密码强度
 * @param {String} password - 密码
 * @param {Object} requirements - 密码要求
 * @returns {Object} - 验证结果
 */
const validatePasswordStrength = (password, requirements = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSymbols = false
  } = requirements;
  
  const result = {
    isValid: true,
    errors: []
  };
  
  // 检查长度
  if (password.length < minLength) {
    result.isValid = false;
    result.errors.push(`密码长度必须至少为${minLength}个字符`);
  }
  
  // 检查大写字母
  if (requireUppercase && !/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('密码必须包含至少一个大写字母');
  }
  
  // 检查小写字母
  if (requireLowercase && !/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push('密码必须包含至少一个小写字母');
  }
  
  // 检查数字
  if (requireNumbers && !/[0-9]/.test(password)) {
    result.isValid = false;
    result.errors.push('密码必须包含至少一个数字');
  }
  
  // 检查特殊符号
  if (requireSymbols && !/[^a-zA-Z0-9]/.test(password)) {
    result.isValid = false;
    result.errors.push('密码必须包含至少一个特殊字符');
  }
  
  return result;
};

module.exports = {
  generateRandomString,
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  validatePasswordStrength
};