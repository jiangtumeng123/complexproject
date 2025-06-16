async function getSystemUserData(connection) {
    const result= await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM user', (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        })
    })
    if(result.length > 0){
        return result;
     }else{
         return null;
     }
}

async function getSystemCounts(connection) {
    const result= await new Promise((resolve, reject) => {
        connection.query('SELECT COUNT(*) as userCount,COUNT(DISTINCT organization) AS clubCount FROM user', (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        })
    })
    if(result.length > 0){
        return result;
     }else{
         return null;
     }
}

async function updateUser(name,email,role,Integral,organization,id, connection) {
    try {
        if (!connection) {
            throw new Error('数据库连接未建立');
        }
        console.log(name,email,role,Integral,organization,id)
        const result = await new Promise((resolve, reject) => {
            connection.query(
                `UPDATE user SET email=?,name=?, role = ?, Integral = ?, organization = ? WHERE id=?`, 
                [name,email,role,Integral,organization,id], 
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
            console.log('用户邮箱更新成功');
            return true;
        }
    } catch (error) {
        console.error('reviseEmail 函数执行错误：', error);
        throw error;
    }
}
module.exports = {
    getSystemUserData,
    getSystemCounts,
    updateUser
}