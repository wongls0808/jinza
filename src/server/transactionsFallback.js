// 交易数据处理工具
import express from 'express'
import { getMockTransactions, getMockTransactionStats } from './mockTransactions.js'
import * as auth from './auth.js'

// 创建一个包装函数，在没有数据库连接时使用模拟数据
export function createTransactionsController() {
  const router = express.Router()
  
  // 获取交易列表API
  // 与真实路由保持一致的鉴权要求
  router.get('/', auth.authMiddleware(true), auth.requirePerm('view_transactions'), async (req, res) => {
    try {
      // 使用模拟数据
      console.log('使用模拟交易数据...')
      return res.json(getMockTransactions(req.query))
    } catch (error) {
      console.error('获取交易数据失败:', error)
      res.status(500).json({ error: '获取交易数据失败', detail: error.message })
    }
  })
  
  // 获取交易统计API
  router.get('/stats', auth.authMiddleware(true), auth.requirePerm('view_transactions'), async (req, res) => {
    try {
      // 使用模拟数据
      console.log('使用模拟交易统计数据...')
      return res.json(getMockTransactionStats())
    } catch (error) {
      console.error('获取交易统计数据失败:', error)
      res.status(500).json({ error: '获取交易统计数据失败', detail: error.message })
    }
  })
  
  return router
}