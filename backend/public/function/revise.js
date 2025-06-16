async function reviseEmail(value, name, connection) {
    try {
        if (!connection) {
            throw new Error('数据库连接未建立');
        }
        
        console.log('开始更新用户信息，参数：', { value, name });
        const email = value.email;
        const names = value.name;
        const result = await new Promise((resolve, reject) => {
            connection.query(
                `UPDATE user SET email=?,name=? WHERE name=?`, 
                [email, names, name], 
                (err, rows) => {
                    if (err) {
                        console.error('数据库更新错误：', err);
                        reject(err);
                    } else {
                        console.log('更新结果：', rows);
                        resolve(rows);
                    }
                }
            );
        });

        console.log('更新操作完成，影响行数：', result.affectedRows);
        
        if (result.affectedRows === 0) {
            console.log('未找到匹配的用户记录');
            return false;
        } else {
            console.log('用户信息更新成功');
            return true;
        }
    } catch (error) {
        console.error('reviseEmail 函数执行错误：', error);
        throw error;
    }
}

async function revisePassword(name, password, connection) {
    try {
        if (!connection) {
            throw new Error('数据库连接未建立');
        }
        
        console.log('开始更新密码，用户名：', name);
        
        const result = await new Promise((resolve, reject) => {
            connection.query(
                `UPDATE user SET password=? WHERE name=?`, 
                [password, name], 
                (err, rows) => {
                    if (err) {
                        console.error('数据库更新错误：', err);
                        reject(err);
                    } else {
                        console.log('更新结果：', rows);
                        resolve(rows);
                    }
                }
            );
        });

        console.log('更新操作完成，影响行数：', result.affectedRows);
        
        if (result.affectedRows === 0) {
            console.log('未找到匹配的用户记录');
            return false;
        } else {
            console.log('用户密码更新成功');
            return true;
        }
    } catch (error) {
        console.error('revisePassword 函数执行错误：', error);
        throw error;
    }
}

module.exports = {
    reviseEmail,
    revisePassword
};