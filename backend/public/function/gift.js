async function getGifts(connection) {
    const result=await new Promise((resolve,reject)=>{
        connection.query("SELECT * FROM gifts", (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    })
    console.log(result);
    if(result.length>0){
        return result;
    }else{
        return null;
    }
}

async function saveGift(connection,name, points, stock, imagePath) {
    try {
        const result = await new Promise((resolve, reject) => {
            connection.query(
                "INSERT INTO gifts (gift_name, points_required, remaining_quantity, image_path) VALUES (?, ?, ?, ?)",
                [name, points, stock, imagePath],
                (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                }
            );
        });
        
        if (result.affectedRows > 0) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('保存礼品信息失败:', error);
        throw error;
    }
}

async function exchangeGift(connection, giftId, userId, quantity, price) {
    const result=await new Promise((resolve,reject)=>{
        connection.query("INSERT INTO user_gifts (gift_id, user_id, quantity, exchange_time) VALUES (?, ?, ?, NOW())", [giftId, userId, quantity], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    })

    if(result.affectedRows>0){
        try {
            // 更新礼品库存
            const updateGiftResult = await new Promise((resolve, reject) => {
                connection.query(
                    "UPDATE gifts SET remaining_quantity = remaining_quantity - ? WHERE id = ?", 
                    [quantity, giftId], 
                    (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    }
                );
            });

            // 更新用户积分
            const updateUserResult = await new Promise((resolve, reject) => {
                connection.query(
                    "UPDATE user SET Integral = Integral - ? WHERE id = ?", 
                    [price, userId], 
                    (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    }
                );
            });

            // 检查两个更新操作是否都成功
            if(updateGiftResult.affectedRows > 0 && updateUserResult.affectedRows > 0){
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('更新操作失败:', error);
            return false;
        }
    }
}

async function getExchangeRecords(connection, userId) {
    const result=await new Promise((resolve,reject)=>{
        connection.query("SELECT gift_name,quantity,image_path,points_required,exchange_time FROM user_gifts JOIN gifts ON user_gifts.gift_id = gifts.id WHERE user_id = ?", [userId], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    })
    
    console.log("result",result);
    if(result.length>0){

        return result;
    }else{
        return null;
    }
}
module.exports = {
    getGifts,
    saveGift,
    exchangeGift,
    getExchangeRecords
}
// SELECT gift_name,quantity,image_path FROM user_gifts JOIN gifts ON user_gifts.gift_id = gifts.id WHERE user_id = 1 AND user_gifts.gift_id = 11;