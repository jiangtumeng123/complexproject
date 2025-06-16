const mysql = require('mysql2/promise');
const dayjs = require('dayjs');

// 计算两点之间的距离（单位：公里）
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 地球半径，单位：公里
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

async function getMyActivities(connection, userId) {
    const query = `
        SELECT 
            e.*,
            a.checked_in,
            a.checked_out,
            a.check_in_location,
            a.check_out_location
        FROM events e
        JOIN application ap ON e.id = ap.active_id
        LEFT JOIN attendance a ON e.id = a.activity_id AND a.user_id = ?
        WHERE ap.user_id = ? AND e.status = 'approved'
    `;

    const [rows] = await connection.execute(query, [userId, userId]);
    return rows;
}

const checkIn = async (connection, activityId, userId, longitude, latitude) => {
    try {
        // 检查是否已经签到
        const checkResult = await new Promise((resolve, reject) => {
            connection.query(
                'SELECT * FROM attendance WHERE activity_id = ? AND user_id = ?',
                [activityId, userId],
                (err, results) => {
                    if (err) reject(err);
                    resolve(results);
                }
            );
        });

        if (checkResult.length > 0 && checkResult[0].checked_in) {
            return { success: false, message: '已经签到过了' };
        }

        // 获取活动信息
        const activityResult = await new Promise((resolve, reject) => {
            connection.query(
                'SELECT * FROM events WHERE id = ?',
                [activityId],
                (err, results) => {
                    if (err) reject(err);
                    resolve(results);
                }
            );
        });

        if (activityResult.length === 0) {
            return { success: false, message: '活动不存在' };
        }

        const activity = activityResult[0];
        const now = new Date();
        const startTime = new Date(activity.startTime);
        const endTime = new Date(activity.endTime);

        // 检查是否在签到时间范围内
        if (now < startTime || now > new Date(startTime.getTime() + 5 * 60000)) {
            return { success: false, message: '不在签到时间范围内' };
        }

        // 计算距离
        const distance = calculateDistance(
            latitude,
            longitude,
            activity.location_lat,
            activity.location_lng
        );
console.log("distance", distance);
        if (distance > 0.5) {
            return { success: false, message: '不在活动地点范围内' };
        }

        // 更新签到状态
        if (checkResult.length === 0) {
            await new Promise((resolve, reject) => {
                connection.query(
                    'INSERT INTO attendance (activity_id, user_id, checked_in, check_in_time, check_in_location) VALUES (?, ?, true, NOW(), POINT(?, ?))',
                    [activityId, userId, longitude, latitude],
                    (err, result) => {
                        if (err) reject(err);
                        resolve(result);
                    }
                );
            });
        } else {
            await new Promise((resolve, reject) => {
                connection.query(
                    'UPDATE attendance SET checked_in = NOW(), check_in_location = POINT(?, ?) WHERE activity_id = ? AND user_id = ?',
                    [longitude, latitude, activityId, userId],
                    (err, result) => {
                        if (err) reject(err);
                        resolve(result);
                    }
                );
            });
        }

        return { success: true, message: '签到成功' };
    } catch (error) {
        console.error('签到错误:', error);
        throw error;
    }
};

const checkOut = async (connection, activityId, userId, longitude, latitude) => {
    try {
        // 检查是否已经签退
        const checkResult = await new Promise((resolve, reject) => {
            connection.query(
                'SELECT * FROM attendance WHERE activity_id = ? AND user_id = ?',
                [activityId, userId],
                (err, results) => {
                    if (err) reject(err);
                    resolve(results);
                }
            );
        });

        if (checkResult.length === 0 || !checkResult[0].checked_in) {
            return { success: false, message: '请先签到' };
        }

        if (checkResult[0].checked_out) {
            return { success: false, message: '已经签退过了' };
        }

        // 获取活动信息
        const activityResult = await new Promise((resolve, reject) => {
            connection.query(
                'SELECT * FROM events WHERE id = ?',
                [activityId],
                (err, results) => {
                    if (err) reject(err);
                    resolve(results);
                }
            );
        });

        if (activityResult.length === 0) {
            return { success: false, message: '活动不存在' };
        }

        const activity = activityResult[0];
        const now = new Date();
        const endTime = new Date(activity.endTime);

        // 检查是否在签退时间范围内
        if (now < new Date(endTime.getTime() - 3 * 60000) || now > endTime) {
            return { success: false, message: '不在签退时间范围内' };
        }

        // 计算距离
        const distance = calculateDistance(
            latitude,
            longitude,
            activity.location_lat,
            activity.location_lng
        );

        if (distance > 0.5) {
            return { success: false, message: '不在活动地点范围内' };
        }

        // 更新签退状态并添加积分
        await new Promise((resolve, reject) => {
            connection.query(
                'UPDATE attendance SET checked_out =  NOW(), check_out_location = POINT(?, ?), points_added = true WHERE activity_id = ? AND user_id = ?',
                [longitude, latitude, activityId, userId],
                (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                }
            );
        });

        // 更新用户积分
        await new Promise((resolve, reject) => {
            connection.query(
                'UPDATE user SET Integral = Integral + ? WHERE id = ?',
                [activity.points, userId],
                (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                }
            );
        });

        return { success: true, message: '签退成功，积分已添加' };
    } catch (error) {
        console.error('签退错误:', error);
        throw error;
    }
};

const getActivityCheckInStatus = async (userId, activityId, connection) => {
    try {
        const result = await new Promise((resolve, reject) => {
            connection.query(
                `SELECT a.checked_in, a.checked_out, a.points_added FROM attendance a LEFT JOIN events e ON a.activity_id = e.id WHERE a.user_id = ? AND a.activity_id = ?`,
                [userId, activityId],
                (err, results) => {
                    if (err) reject(err);
                    resolve(results);
                }
            );
        });

        if (result.length > 0) {
            return {
                checkedIn: result[0].checked_in !== null ? 1 : 0,
                checkedOut: result[0].checked_out !== null ? 1 : 0,
                pointsAdded: result[0].points_added === 1 ? 1 : 0
            };
        }
        return null;
    } catch (error) {
        console.error('获取签到状态错误:', error);
        throw error;
    }
};

module.exports = {
    getMyActivities,
    checkIn,
    checkOut,
    getActivityCheckInStatus
}; 