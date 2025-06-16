async function login(username, password, connection) {
    try {
        console.log('登录请求:', { username });
        const result = await new Promise((resolve, reject) => { 
            connection.query(
                'SELECT * FROM user WHERE name = ? AND password = ?', 
                [username, password], 
                (err, rows) => {
                    if (err) {
                        console.error('数据库查询错误:', err);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });

        if (result && result.length > 0) {
            const user = result[0];
            // 如果是club身份，必须status为approved才能登录
            console.log('用户信息:', user);
            if (user.role === 'club' && user.status !== 'approved') {
                console.log('登录失败: 社团团长未审核或未通过');
                return null;
            }
            console.log('登录成功:', user.name);
            return user;
        } else {
            console.log('登录失败: 用户名或密码错误');
            return null;
        }
        
    } catch (error) {
        console.error('登录过程发生错误:', error);
        throw error;
    }
}

module.exports = { login };
