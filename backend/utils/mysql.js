const { query } = require('express');
const mysql = require('mysql2');
 
// 创建连接池
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'integral'
});
 
// 从连接池获取连接
pool.getConnection((err, connection) => {
  if (err) throw err; // 如果有错误，抛出错误
  // 使用连接执行查询
  connection.query('SELECT 1 + 1 AS solution', (error, results, fields) => {
    if (error) throw error;
    console.log('The solution is: ', results[0].solution);
    // 结束连接
    connection.release();
  });
});
 

// 导出连接池
module.exports = pool;