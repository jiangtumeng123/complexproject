async function saveActive(connection, title, description, startTime, endTime, location, maxParticipants, imagePaths, name, latitude, longitude, points) {
    try {
        console.log('保存活动数据:', {
            title,
            description,
            startTime,
            endTime,
            location,
            maxParticipants,
            imagePaths,
            name,
            points
        });

        const image = imagePaths[0] || null;
        console.log('使用的图片路径:', image);
const status='pending'
        const result = await new Promise((resolve, reject) => {
            connection.query(
                `INSERT INTO events (title, description, startTime, endTime, location, maxParticipants, image, name, status, location_lat, location_lng, points) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [title, description, startTime, endTime, location, maxParticipants, image, name, status, latitude, longitude, points],
                (err, result) => {
                    if (err) {
                        console.error('数据库插入错误:', err);
                        reject(err);
                    } else {
                        console.log('插入结果:', result);
                        resolve(result);
                    }
                }
            );
        });

        if (result && result.affectedRows > 0) {
            console.log('活动保存成功，影响行数:', result.affectedRows);
            return true;
        } else {
            console.log('活动保存失败，未影响任何行');
            return false;
        }
    } catch (error) {
        console.error('保存活动时发生错误:', error);
        throw error;
    }
}

module.exports = { saveActive };