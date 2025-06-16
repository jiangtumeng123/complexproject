async function getMylist(connection,id) {
    console.log("getMylist",id);
    const result= await new Promise((resolve,reject)=>{
        connection.query('SELECT e.*, a.checked_in, a.checked_out, a.points_added FROM events e LEFT JOIN attendance a ON e.id = a.activity_id where a.user_id = ?',[id],(err,rows)=>{
            if(err) reject(err);
            resolve(rows);
        })
    })
    if(result.length>0){
        return result;
    }else{
        return null;
    }
}
module.exports = getMylist;
//'SELECT e.*, a.points_added FROM events e LEFT JOIN attendance a  ON e.id = a.active_id where a.user_id=? GROUP BY e.id;'