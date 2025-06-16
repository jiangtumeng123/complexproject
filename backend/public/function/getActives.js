async function getActivities(connection, organization) {
    let Result = [];
    let arr = organization.split(",");
    console.log('organization', arr.length);
    
    for (let i = 0; i < arr.length; i++) {
        console.log('arr[i]', arr[i]);
        const result = await new Promise((resolve, reject) => {
            connection.query(
                'SELECT e.*, COUNT(a.active_id) AS application_count, u.organization AS organization_info' +
                ' FROM events e' +
                ' LEFT JOIN application a ON e.id = a.active_id' +
                ' LEFT JOIN user u ON e.name = u.name' +
                ' WHERE e.status = "approved" AND u.organization = ?' +
                ' GROUP BY e.id, u.organization',
                [arr[i]],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
        
        // 将每次查询的结果添加到 Result 数组中
        if (result && result.length > 0) {
            Result = Result.concat(result);
        }
    }
    
    console.log('Final Result:', Result);
    if (Result.length > 0) {
        return Result;
    } else {
        return null;
    }
}

async function apply(connection, activeid, userid) {
    console.log(activeid, userid);
    userid = parseInt(userid);
    
    // 检查是否已经报名
    const result = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM application WHERE active_id = ? AND user_id = ?', [activeid, userid], (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });

    if (result.length > 0) {
        // 已经报名过，返回 false
        return false;
    } else {
        // 未报名，执行插入操作
        const result2 = await new Promise((resolve, reject) => {
            connection.query('INSERT INTO attendance (activity_id, user_id) VALUES (?, ?)', [activeid, userid], (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
                console.log("rows",rows);
            });
        });
        const result3 = await new Promise((resolve, reject) => {
            connection.query('INSERT INTO application (active_id, user_id) VALUES (?, ?)', [activeid, userid], (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
                console.log("rows",rows);
            });
        });

        // 返回插入是否成功
        return result2.affectedRows > 0;
    }
}
module.exports = { getActivities, apply };