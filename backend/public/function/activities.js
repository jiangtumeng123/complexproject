async function getActivityCheckInStatus(userId, activityId, connection) {
    try {
        const result = await new Promise((resolve, reject) => {
            connection.query(
                `SELECT 
                    CASE WHEN check_in_time IS NOT NULL THEN true ELSE false END as checked_in,
                    CASE WHEN check_out_time IS NOT NULL THEN true ELSE false END as checked_out
                FROM activity_participants 
                WHERE user_id = ? AND activity_id = ?`,
                [userId, activityId],
                (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results[0] || { checked_in: false, checked_out: false });
                    }
                }
            );
        });
        return result;
    } catch (error) {
        console.error('查询签到状态失败:', error);
        throw error;
    }
}

module.exports = {
    getActivityCheckInStatus
}; 