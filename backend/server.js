// backend/server.js
const express = require('express');
const cors = require('cors');
const app = express();
const pool = require('./utils/mysql');
const indexRouter = require('./routes/index');
const path = require('path');

app.use(cors());
app.use(express.json());

// 配置静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use(function transactionMiddleware(req, res, next) {
  // 开启一个事务
  pool.getConnection((err, connection) => {
      if (err) {
          return next(err); // 出错时进入Express错误处理中间件
      }
      // 将连接绑定到请求对象，以便在后续中间件中使用
      connection.beginTransaction((beginErr) => {
          if (beginErr) {
              connection.release(); // 开启事务失败时释放连接
              return next(beginErr); // 出错时进入Express错误处理中间件
          }
          // 将连接绑定到请求对象
          req.transactionConnection = connection;
          next(); // 继续执行下一个中间件或路由处理器
      });
  });
});

app.use('/', indexRouter);


// app.get('/', (req, res) => {
//   res.send('Hello from backend!');
// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
