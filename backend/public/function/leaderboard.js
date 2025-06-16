const mysql = require('mysql2/promise');

async function getLeaderboardData(connection, type, data) {
    try {
        let query;
        let params = [];
        console.log("data",data);
        if (type === 'person') {
            // 获取个人积分排行榜
            if (!data) {
                throw new Error('个人排行榜需要提供组织数据');
            }
            let arr = data.split(",").map(item => item.trim()).filter(Boolean);
            // 构建 FIND_IN_SET 查询
            let conditions = arr.map(() => `FIND_IN_SET(?, organization)`).join(' OR ');
            console.log("conditions",conditions);
            query = `
                SELECT 
                    name, 
                    Integral
                FROM 
                    user
                WHERE 
                    role != 'admin' 
                    AND (${conditions})
                ORDER BY 
                    Integral DESC
                LIMIT 5;
            `;
            params = arr;
        }
        else if (type === 'organization') {
            // 获取组织积分排行榜
            query = `
                SELECT 
                    name, 
                    SUM(Integral) AS Integral
                FROM (
                    SELECT 
                        SUBSTRING_INDEX(SUBSTRING_INDEX(organization, ',', numbers.n), ',', -1) AS name, 
                        Integral
                    FROM 
                        user
                        CROSS JOIN (
                            SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
                        ) numbers
                    WHERE 
                        organization IS NOT NULL 
                        AND organization != ''
                ) AS subquery
                GROUP BY 
                    name
                ORDER BY 
                    Integral DESC
                LIMIT 5;
            `;
        } 
        else {
            throw new Error('无效的排行榜类型');
        }

        const result = await new Promise((resolve, reject) => {
            if (type === 'person') {
                connection.query(query, params, (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            } else {
                connection.query(query, (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
        
        console.log('排行榜结果:', result);
        return result;
    } catch (error) {
        console.error('获取排行榜数据错误:', error);
        throw error;
    }
}

module.exports = {
    getLeaderboardData
}; 