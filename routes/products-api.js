// 查询或创建商品的API
app.post('/api/products/find-or-create', requireAuth, (req, res) => {
  const { description, unit, selling_price } = req.body;
  
  if (!description) {
    return res.status(400).json({ error: '商品描述不能为空' });
  }
  
  // 首先尝试查找匹配的商品
  db.get('SELECT * FROM products WHERE description = ? COLLATE NOCASE', [description], (err, product) => {
    if (err) {
      console.error('查询商品失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }
    
    if (product) {
      // 商品已存在，如果提供了新的价格，则更新平均价格
      if (selling_price) {
        const newAvgPrice = (parseFloat(product.selling_price) + parseFloat(selling_price)) / 2;
        db.run(
          `UPDATE products 
           SET selling_price = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [newAvgPrice, product.id],
          (err) => {
            if (err) {
              console.error('更新商品价格失败:', err);
              // 即使更新失败，仍返回原始商品数据
            }
            // 返回更新后的商品
            res.json({
              ...product,
              selling_price: newAvgPrice
            });
          }
        );
      } else {
        // 没有提供新价格，直接返回现有商品
        res.json(product);
      }
      return;
    }
    
    // 商品不存在，创建新商品
    // 生成9位随机商品编码
    const generateRandomCode = () => {
      const digits = '0123456789';
      let code = '';
      for (let i = 0; i < 9; i++) {
        code += digits[Math.floor(Math.random() * 10)];
      }
      return code;
    };
    
    // 尝试生成唯一编码，最多尝试10次
    const tryGenerateUniqueCode = (attempt = 0) => {
      if (attempt >= 10) {
        return res.status(500).json({ error: '无法生成唯一商品编码，请稍后再试' });
      }
      
      const code = generateRandomCode();
      
      // 检查编码是否已存在
      db.get('SELECT id FROM products WHERE code = ?', [code], (err, existing) => {
        if (err) {
          console.error('检查商品编码失败:', err);
          return res.status(500).json({ error: '服务器错误' });
        }
        
        if (existing) {
          // 编码已存在，重试
          return tryGenerateUniqueCode(attempt + 1);
        }
        
        // 插入新商品
        db.run(
          `INSERT INTO products (code, description, unit, selling_price, created_by) 
           VALUES (?, ?, ?, ?, ?)`,
          [code, description, unit || '', selling_price || 0, req.session.userId],
          function(err) {
            if (err) {
              console.error('创建商品失败:', err);
              return res.status(500).json({ error: '创建商品失败' });
            }
            
            // 返回新创建的商品
            res.json({ 
              id: this.lastID, 
              code,
              description, 
              unit: unit || '', 
              selling_price: selling_price || 0,
              created_by: req.session.userId
            });
          }
        );
      });
    };
    
    // 开始尝试生成唯一编码
    tryGenerateUniqueCode();
  });
});