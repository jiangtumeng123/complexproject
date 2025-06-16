async function getPendingActivities(connection) {
    const result = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM events WHERE status="pending"', (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    })
    if (result.length > 0) {
        return result[0];
    } else {
        return null;
    }
};
// 异步函数，用于审核活动
async function reviewActivity(connection, activityId, status, reason) {
    try {
        // 打印活动ID和状态
        console.log(activityId, status);
        // 创建一个新的Promise对象，用于异步查询数据库
        const result = await new Promise((resolve, reject) => {
            // 执行数据库查询，更新活动状态和意见
            connection.query('UPDATE events SET status = ?, opinion = ? WHERE id = ?', [status, reason, activityId], (err, rows) => {
                if (err) {
                    // 如果查询出错，则拒绝Promise
                    reject(err);
                } else {
                    // 如果查询成功，则解析Promise
                    resolve(rows);
                }
            })
        })
        // 打印查询结果
        console.log(result);
        // 如果受影响的行数大于0，则返回true，否则返回false
        if (result.affectedRows > 0) {
            return true;
        } else {
            return false;
        }

    } catch (err) {
        // 如果发生错误，则打印错误信息，并返回false
        console.log(err);
        return false;
    }
}

async function getActivitiesstatus(connection,name) {
    console.log(name);
    const result = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM events WHERE name=?',[name], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    })
    if (result.length > 0) {
        return result;
    } else {
        return null;
    }
};

module.exports = {
    getPendingActivities,
    reviewActivity,
    getActivitiesstatus
}