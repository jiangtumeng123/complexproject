async function getPendingClubs(connection) {
    const result = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM user WHERE role="club" AND status="pending"', (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
    console.log("result",result);
    if(result.length > 0){
        return result;
    }else{
        return null;
    }
}

async function reviewClub(connection, id, status) {
    const result = await new Promise((resolve, reject) => {
        connection.query('UPDATE user SET status=? WHERE id=?', [status, id], (err, rows) => {
            if (err) {
                reject(err);    
            } else {
                resolve(rows);
            }
        });
    });
    console.log("result",result);
    if(result.affectedRows > 0){
        return true;
    }else{
        return false;
    }
}

module.exports = { getPendingClubs, reviewClub };