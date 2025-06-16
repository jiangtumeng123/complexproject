async function getUser(name, connection) {
    // console.log(name);
    const result = await new Promise((resolve, reject) => {
        connection.query('SELECT * FROM user WHERE name = ?', [name], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                
                resolve(rows);
            }
        });
    });
    // console.log(result);
    if(result.length > 0){
        return result[0];
    }else{  
        return null;
    }
}

module.exports = {getUser};

