async function getUserAppliedActivities(userId, connection) {
    const result = await await new Promise((resolve, reject) => {
    connection.query(`SELECT e.id AS event_id,CASE   WHEN EXISTS (SELECT 1 FROM application a  WHERE a.user_id = ? AND a.active_id = e.id
        ) THEN 'true'
        ELSE 'false'
    END AS is_participated
FROM 
    events e;`, [userId],(err, rows) => {
        if (err) {
            reject(err);
        }else {
            resolve(rows);
        }
       
    });
});
console.log(result);
    if (result.length > 0) {
        return result;
    }else {
        return null;
    }

}
module.exports = {
    getUserAppliedActivities
}