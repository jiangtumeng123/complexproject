const express = require('express');
const router = express.Router();
const { register } = require('../public/function/register');
const { login } = require('../public/function/login');
const { sendEmail } = require('../public/function/emailVerification');
const { getUser } = require('../public/function/getUser');
const { reviseEmail, revisePassword } = require('../public/function/revise');
const { saveActive } = require('../public/function/active');
const {getPendingActivities, reviewActivity, getActivitiesstatus} =require('../public/function/audit')
const {getActivities,apply} = require('../public/function/getActives')
const getMylist = require('../public/function/myActives')
const{checkIn,checkOut,getActivityCheckInStatus} = require('../public/function/myActivities')
const {getSystemUserData,getSystemCounts,updateUser} = require('../public/function/systemData')
const { getLeaderboardData } = require('../public/function/leaderboard');
const{getUserAppliedActivities}= require('../public/function/applied');
const{getGifts, saveGift, exchangeGift, getExchangeRecords} = require('../public/function/gift');
const { getPendingClubs, reviewClub } = require('../public/function/club');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
let codes = '';

// 活动图片存储配置
const activityStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/activities';
        // 确保上传目录存在
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 生成唯一的文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 礼品图片存储配置
const giftStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/gifts';
        // 确保上传目录存在
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 生成唯一的文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'gift-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 身份证明存储配置
const identityStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/identity';
        // 确保上传目录存在
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 生成唯一的文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'identity-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 通用的文件过滤器
const imageFilter = (req, file, cb) => {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('只允许上传图片文件！'), false);
    }
};

// 活动图片上传配置
const activityUpload = multer({
    storage: activityStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
    },
    fileFilter: imageFilter
});

// 礼品图片上传配置
const giftUpload = multer({
    storage: giftStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
    },
    fileFilter: imageFilter
});

// 身份证明上传配置
const identityUpload = multer({
    storage: identityStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
    },
    fileFilter: imageFilter
});

router.get('/', async (req, res) => {
    const connection = req.transactionConnection;
    try {
        // 只处理有效的登录请求
        if (!req.query.username || !req.query.password) {
            return res.status(400).json({ 
                success: false, 
                message: '用户名和密码不能为空' 
            });
        }

        const { username, password } = req.query;
        console.log("登录请求:", { username, password });

        const user = await login(username, password, connection);
        
        if (user) {
            // 操作成功，提交事务
            connection.commit((commitErr) => {
                if (commitErr) {
                    console.error('提交事务错误:', commitErr);
                    connection.rollback(() => {
                        connection.release();
                        res.status(500).json({ 
                            success: false, 
                            message: '服务器内部错误' 
                        });
                    });
                } else {
                    connection.release();
                    res.json({ 
                        success: true, 
                        message: '登录成功',
                        data: [user]
                    });
                }
            });
        } else {
            connection.rollback(() => {
                connection.release();
                res.json({ 
                    success: false, 
                    message: '用户名或密码错误' 
                });
            });
        }
    } catch (error) {
        console.error('登录过程发生错误:', error);
        connection.rollback(() => {
            connection.release();
            res.status(500).json({ 
                success: false, 
                message: '服务器内部错误' 
            });
        });
    }
});

router.post('/register', identityUpload.single('identityProof'), (req, res) => {
    const { username, password, email, role, captcha, Societies } = req.body;
    const identityProofPath = req.file ? req.file.path : null;
    console.log("Received req.body:", req.body);
    const societiesValue = Array.isArray(Societies) ? Societies.join(',') : Societies;
    console.log("Captcha:", captcha);
    console.log("Expected Code:", codes);
    const connection = req.transactionConnection;
    if (captcha === codes) {
        const result = register(username, password, email, role, societiesValue, identityProofPath, connection);
        console.log(username, password, email);
        result.then((value) => {
            console.log("Register function result:", value);
            if (value) {
                //  操作成功，提交事务
                connection.commit((commitErr) => {
                    connection.release();
                    if (commitErr) {
                        console.error('Commit error:', commitErr);
                        res.status(500).json({ success: false, message: '服务器内部错误 (提交事务失败)' });
                    } else {
                        //响应
                        res.json({ success: true, message: '注册成功' });
                    }
                });
            } else {
                // 发生错误时回滚事务
                connection.rollback(() => {
                    connection.release();
                    res.json({ success: false, message: '注册失败' });
                });
            }
        }).catch(error => {
            console.error('Error during registration process:', error);
            connection.rollback(() => {
                connection.release();
                res.status(500).json({ success: false, message: '注册过程中发生错误', error: error.message });
            });
        });
    } else {
        res.status(400).json({ success: false, message: '验证码错误' });
    }
});

router.post('/verify', (req, res) => {
    const { email, code } = req.body;
    const result = sendEmail(email, code);
    result.then((value) => {
        if (value.success) {
            codes = value.code
            console.log("codes", codes);
            res.send(value);
        } else {
            res.send({ code: 400, message: '验证码发送失败' });
        }
    });
});

router.get('/user', (req, res) => {
    if (!req.query.name) {
        return;
    }
    console.log(req.query);
    const { name } = req.query;
    console.log(name);
    const connection = req.transactionConnection;
    const result = getUser(name, connection);
    result.then((value) => {
        if (value !== null) {
            console.log(value);
            //  操作成功，提交事务
            connection.commit((commitErr) => {
                connection.release();
                if (commitErr) {
                    res.status(500).send('Error occurred');
                } else {
                    //响应
                    res.send({ success: true, user: value })
                }
            })
        } else {
            res.send({ success: false, message: '获取用户信息失败' });
        }
    });
});

router.post('/updateUser', (req, res) => {
    console.log(req.body);
    const { value, name } = req.body;
    const connection = req.transactionConnection;
    const result = reviseEmail(value, name, connection);
    result.then((value) => {
        if (value !== null) {
            console.log(value);
            //  操作成功，提交事务
            connection.commit((commitErr) => {
                connection.release();
                if (commitErr) {
                    res.status(500).send('Error occurred');
                } else {
                    //响应
                    res.send(value)
                }
            })
        } else {
            res.send({ success: false, message: '管理员修改失败' });
        }
    })
})

router.post('/updatePassword', (req, res) => {
    console.log(req.body);
    const { name, newPassword } = req.body;
    const connection = req.transactionConnection;
    const result = revisePassword(name, newPassword, connection);
    result.then((value) => {
        if (value !== null) {
            console.log(value);
            //  操作成功，提交事务
            connection.commit((commitErr) => {
                connection.release();
                if (commitErr) {
                    res.status(500).send('Error occurred');
                } else {
                    //响应
                    res.send(value)
                }
            })
        } else {
            res.send({ success: false, message: '修改密码失败' });
        }
    })
})

router.post('/activity/publish', activityUpload.array('images', 9), (req, res) => {
    try {
        // 获取表单数据
        const {
            title,
            description,
            startTime,
            endTime,
            location,
            latitude,
            longitude,
            maxParticipants,
            name,
            points
        } = req.body;

        // 获取上传的文件信息
        const files = req.files;
        const imagePaths = files ? files.map(file => file.path) : [];

        // 打印接收到的数据
        console.log('表单数据:', {
            title,
            description,
            startTime,
            endTime,
            location,
            latitude,
            longitude,
            maxParticipants,
            name,
            points
        });
        console.log('上传的文件:', imagePaths);

        const connection = req.transactionConnection;
        const result = saveActive(
            connection,
            title,
            description,
            startTime,
            endTime,
            location,
            maxParticipants,
            imagePaths,
            name,
            latitude,
            longitude,
            points
        );

        result.then((value) => {
            if (value) {
                // 操作成功，提交事务
                connection.commit((commitErr) => {
                    if (commitErr) {
                        console.error('提交事务错误:', commitErr);
                        connection.rollback(() => {
                            connection.release();
                            res.status(500).json({
                                success: false,
                                message: '提交事务失败',
                                error: commitErr.message
                            });
                        });
                    } else {
                        connection.release();
                        res.json({
                            success: true,
                            message: '活动发布成功',
                            data: {
                                ...req.body,
                                images: imagePaths
                            }
                        });
                    }
                });
            } else {
                // 活动保存失败，回滚事务
                connection.rollback(() => {
                    connection.release();
                    res.status(500).json({
                        success: false,
                        message: '活动保存失败'
                    });
                });
            }
        }).catch(error => {
            console.error('保存活动错误:', error);
            connection.rollback(() => {
                connection.release();
                res.status(500).json({
                    success: false,
                    message: '活动保存失败',
                    error: error.message
                });
            });
        });
    } catch (error) {
        console.error('处理请求错误:', error);
        if (req.transactionConnection) {
            req.transactionConnection.rollback(() => {
                req.transactionConnection.release();
            });
        }
        res.status(500).json({
            success: false,
            message: '处理请求失败',
            error: error.message
        });
    }
});

// 获取待审核活动
router.get('/activities', async (req, res) => {
    try {
      const connection = req.transactionConnection;
      const value = await getPendingActivities(connection);
      if (value !== null) {
        console.log(value);
        //  操作成功，提交事务
        connection.commit((commitErr) => {
          connection.release();
          if (commitErr) {
            res.status(500).send('Error occurred');
          } else {
            //响应
            res.send({ success: true, data: Array.isArray(value) ? value : [value] })
          }
        })
      } else {
        res.send({ success: true, data: [] });
      }
    } catch (error) {
      console.error('获取待审核活动失败:', error);
      res.status(500).json({ message: '获取活动列表失败' });
    }
  });
  
  // 审核活动
  router.post('/review', async (req, res) => {
    try {
      const { activityId, status, reason } = req.body;
      const connection = req.transactionConnection;
      const result = await reviewActivity(req.transactionConnection, activityId, status, reason);
        if (result) {
          // 操作成功，提交事务
          connection.commit((commitErr) => {
            connection.release();
            if (commitErr) {
              res.status(500).send('Error occurred');
            } else {
              //响应
              res.send({ success: result })
            }
     })
        }else{ 
          res.send({ success: result});
        }
    } catch (error) {
      console.error('审核活动失败:', error);
      res.status(500).json({ message: '审核失败' });
    }
  });

  router.get('/getActivitiesstatus', async (req, res) => {
    try {
        const name = req.query.name;
        console.log(name);
      const connection = req.transactionConnection;
      const value = await getActivitiesstatus(connection, name);
      if (value !== null) {
        console.log(value);
        //  操作成功，提交事务
        connection.commit((commitErr) => {
          connection.release();
          if (commitErr) {
            res.status(500).send('Error occurred');
          } else {
            //响应
            res.send({ success: true, data: Array.isArray(value) ? value : [value] })
          }
        })
      } else {
        res.send({ success: true, data: [] });
      }
    } catch (error) {
      console.error('获取活动审核状态失败:', error);
      res.status(500).json({ message: '获取活动列表失败' });
    }
  });


  router.get('/getActivities', async (req, res) => {
    try {
        const organization = req.query.organization;
        console.log(organization);
      const connection = req.transactionConnection;
      const value = await getActivities(connection, organization);
      if (value !== null) {
        console.log(value);
        //  操作成功，提交事务
        connection.commit((commitErr) => {
          connection.release();
          if (commitErr) {
            res.status(500).send('Error occurred');
          } else {
            //响应
              res.send({ success: true, data: Array.isArray(value) ? value : [value] })

          }       
    })
  }else {
    res.send({ success: true, data: [] });
  }
  } catch (error) {
    console.error('获取活动失败:', error);
    res.status(500).json({ message: '获取活动列表失败' });
  }
})

router.post('/apply', async (req, res) => {
    const{activityId,userID}=req.body;
    console.log(req.body);
     const connection = req.transactionConnection;
     const result = await apply(connection,activityId,userID);
     if (result) {
        console.log(result);
      // 操作成功，提交事务
      connection.commit((commitErr) => {
        connection.release();
        if (commitErr) {
          res.status(500).send('Error occurred');
        } else {
          //响应
          res.send({ success: result })
        }
   })
     }else{
      res.send({ success: result});
     }
    
})

router.get('/myactivities', async (req, res) => {
    console.log('请求参数:', req.query);
    const userId = req.query.userId;
    console.log('用户ID:', userId);
    
    if (!userId) {
        return res.status(400).json({ error: '缺少用户ID参数' });
    }

    try {
        const connection = req.transactionConnection;
        const value = await getMylist(connection, userId);
        
        if (value !== null) {
            console.log('查询结果:', value);
            // 操作成功，提交事务
            connection.commit((commitErr) => {
                connection.release();
                if (commitErr) {
                    res.status(500).send('Error occurred');
                } else {
                    // 响应
                    res.send({ success: true, data: Array.isArray(value) ? value : [value] });
                }
            });
        } else {
            res.send({ success: true, data: [] });
        }
    } catch (error) {
        console.error('获取活动列表错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 签到
router.post('/check-in', async (req, res) => {
    try {
        const connection = req.transactionConnection;
        if (!connection) {
            throw new Error('数据库连接失败');
        }
        const { activityId, userId, longitude, latitude } = req.body;
        if (!activityId || !userId) {
            throw new Error('缺少必要参数');
        }
        const result = await checkIn(connection, activityId, userId, longitude, latitude);
        if (result.success) {
            console.log('查询结果:', result);
            // 操作成功，提交事务
            connection.commit((commitErr) => {
                connection.release();
                if (commitErr) {
                    res.status(500).send('Error occurred');
                } else {
                    // 响应
                    res.send({ success: true, data: Array.isArray(result) ? result : [result]});
                }
            });
        } else {
            res.send({  success: false, data: result});
        }
        // await connection.commit();
        // connection.release();
        // res.json({ success: true, data: result });
    } catch (error) {
        console.error('签到错误:', error);
        if (req.transactionConnection) {
            await req.transactionConnection.rollback();
            req.transactionConnection.release();
        }
        res.status(400).json({ success: false, error: error.message });
    }
});

// 签退
router.post('/check-out', async (req, res) => {
    try {
        const connection = req.transactionConnection;
        if (!connection) {
            throw new Error('数据库连接失败');
        }

        const { activityId, userId, longitude, latitude } = req.body;
        if (!activityId || !userId) {
            throw new Error('缺少必要参数');
        }

        const result = await checkOut(connection, activityId, userId, longitude, latitude);
        console.log('查询结果:', result);
        if (result.success) {
        // 操作成功，提交事务
        connection.commit((commitErr) => {
            connection.release();
            if (commitErr) {
                res.status(500).send('Error occurred');
            } else {
                // 响应
                res.send({ success: true, data: Array.isArray(result) ? result : [result]});
            }
        });
    }else {
        res.send({  success: false, data: result});
    }
    } catch (error) {
        console.error('签退错误:', error);
        if (req.transactionConnection) {
            await req.transactionConnection.rollback();
            req.transactionConnection.release();
        }
        res.status(400).json({ success: false, error: error.message });
    }
});

router.get('/all-users', async (req, res) => {
    const connection = req.transactionConnection;
    const result = await getSystemUserData(connection);
    if (result!=null) {
        console.log('查询结果:', result);
        // 操作成功，提交事务
        connection.commit((commitErr) => {
            connection.release();
            if (commitErr) {
                res.status(500).send('Error occurred');
            } else {
                // 响应
                res.send({ success: true, data: Array.isArray(result) ? result : [result]});
            }
        });
    } else {
        res.send({  success: true, data: []});
    }
})

router.get('/system-stats', async (req, res) => {
    const connection = req.transactionConnection;
    const result = await getSystemCounts(connection);
    if (result!=null) {
        console.log('查询结果:', result);
        // 操作成功，提交事务
        connection.commit((commitErr) => {
            connection.release();
            if (commitErr) {
                res.status(500).send('Error occurred');
            } else {
                // 响应
                res.send({ success: true, data: Array.isArray(result) ? result : [result]});
            }
        });
    }else {
        res.send({  success: true, data: []});
    }
})
router.post('/adminUpdate', async (req, res) => {
    console.log(req.body);
    const { name,email,role,Integral,organization,id } = req.body;
    const connection = req.transactionConnection;
    const result = updateUser(name,email,role,Integral,organization,id, connection);
    result.then((value) => {
        if (value !== null) {
            console.log(value);
            //  操作成功，提交事务
            connection.commit((commitErr) => {
                connection.release();
                if (commitErr) {
                    res.status(500).send('Error occurred');
                } else {
                    //响应
                    res.send(value)
                }
            })
        } else {
            res.send({ success: false, message: '修改用户信息失败' });
        }
    })
})

// 查询用户签到情况
router.get('/check-in-status/:userId/:activityId', async (req, res) => {
    try {
        console.log('查询签到状态',req.params);
        const { userId, activityId } = req.params;
        const connection = req.transactionConnection;
        const status = await getActivityCheckInStatus(userId, activityId, connection);
        console.log('查询结果:', status);
        if (status !== null) {
            //  操作成功，提交事务
            connection.commit((commitErr) => {
                connection.release();
                if (commitErr) {
                    res.status(500).send('Error occurred');
                } else {
                    //响应
                    res.send({success:true ,value:status})
                }
            })
        }else{
            res.send({success:false ,value:[]})
        }
    } catch (error) {
        console.error('查询签到状态失败:', error);
        res.status(500).json({
            success: false,
            message: '查询签到状态失败'
        });
    }
});

// 获取排行榜数据
router.get('/leaderboard', async (req, res) => {
    try {
        console.log("req.query",req.query);
        const { type, data } = req.query;
        const connection = req.transactionConnection;
        const result = await getLeaderboardData(connection, type, data);
        
        if (result !== null) {
            connection.commit((commitErr) => {
                connection.release();
                if (commitErr) {
                    res.status(500).send('Error occurred');
                } else {
                    res.send({ success: true, data: result });
                }
            });
        } else {
            res.send({ success: true, data: [] });
        }
    } catch (error) {
        console.error('获取排行榜数据失败:', error);
        res.status(500).json({ message: '获取排行榜数据失败' });
    }
});

// 获取当前用户已报名的活动ID列表
router.get('/userAppliedActivities', async (req, res) => {
    try {
        const { userId } = req.query;
        const connection = req.transactionConnection;
        const result = await getUserAppliedActivities(userId, connection);
        if (result !== null) {
            connection.commit((commitErr) => {
                connection.release();
                if (commitErr) {
                    res.status(500).send('Error occurred');
                } else {
                    res.send({ success: true, data: result });
                }
            });
        } else {
            res.send({ success: true, data: [] });
        }
    } catch (error) {
        console.error('获取当前用户已报名的活动ID列表失败:', error);
        res.status(500).json({ message: '获取当前用户已报名的活动ID列表失败' });
    }
});

// 获取礼品列表
router.get('/gifts', async (req, res) => {
    try {
    const connection = req.transactionConnection;
      const gifts = await getGifts(connection);
      if (gifts !== null) {
        connection.commit((commitErr) => {
            connection.release();
            if (commitErr) {
                res.status(500).send('Error occurred');
            } else {
                res.send({ success: true, data: Array.isArray(gifts) ? gifts : [gifts]});
            }
        });
    } else {
        res.send({ success: true, data: [] });
    }
    } catch (error) {
      console.error('获取礼品列表错误:', error);
      res.json({ success: false, message: '获取礼品列表失败' });
    }
});

// 上传礼品信息
router.post('/gifts/upload', giftUpload.single('image'), async (req, res) => {
    try {
        const { name, points, stock } = req.body;
        console.log(req.body);
        const imagePath = req.file ? req.file.path : null;

        if (!name || !points || !stock || !imagePath) {
            return res.status(400).json({
                success: false,
                message: '请提供完整的礼品信息（名称、积分、剩余数量和图片）'
            });
        }

        const connection = req.transactionConnection;
        const result = await saveGift(connection, name, points, stock, imagePath);

        if (result) {
            connection.commit((commitErr) => {
                connection.release();
                if (commitErr) {
                    res.status(500).send('Error occurred');
                } else {
                    res.json({
                        success: true,
                        message: '礼品信息上传成功',
                        data: {
                            name,
                            points,
                            stock,
                            imagePath
                        }
                    });
                }
            });
        } else {
            connection.rollback(() => {
                connection.release();
                res.status(500).json({
                    success: false,
                    message: '礼品信息上传失败'
                });
            });
        }
    } catch (error) {
        console.error('上传礼品信息错误:', error);
        if (req.transactionConnection) {
            req.transactionConnection.rollback(() => {
                req.transactionConnection.release();
            });
        }
        res.status(500).json({
            success: false,
            message: '上传礼品信息失败',
            error: error.message
        });
    }
});

router.post('/exchange', async (req, res) => {
    const { userId, giftId, quantity, price } = req.body;
    const connection = req.transactionConnection;
    console.log(userId, giftId, quantity, price);
   const result = await exchangeGift(connection, giftId, userId, quantity, price);
   if(result){
    connection.commit((commitErr) => {
        connection.release();
        if (commitErr) {
            res.status(500).send('Error occurred');
        } else {
            res.send({success:true,message:'兑换成功'});
        }
    });
   }else{
    res.send({success:false,message:'兑换失败'});
   }
})

// 获取兑换记录
router.get('/exchange-records', async (req, res) => {
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ message: '用户名不能为空' });
      }
      const connection = req.transactionConnection;
      const result = await getExchangeRecords(connection, id);
      if(result!=null){
        connection.commit((commitErr) => {
            connection.release();
            if (commitErr) {
                res.status(500).send('Error occurred');
            } else {
                res.send({success:true,data:result});
            }
        });
      }else{
        res.send({success:false,message:'获取兑换记录失败'});
      }
    } catch (error) {
      console.error('获取兑换记录失败:', error);
      res.status(500).json({
        success: false,
        message: '获取兑换记录失败'
      });
    }
  });

  // 获取待审核团长
router.get('/pending-clubs', async (req, res) => {
    try {
        const connection = req.transactionConnection;
        const result = await getPendingClubs(connection);
      if(result!=null){
        connection.commit((commitErr) => {
            connection.release();
            res.send({success:true,data:result});
        });
      }else{
        res.send({success:false,message:'暂无待审核团长'});
      }
    } catch (error) {
        console.error('获取待审核团长失败:', error);
        res.status(500).json({
            success: false,
            message: '获取待审核团长失败'
        });
    }
  });
  
  // 审核团长
  router.post('/review-club', async (req, res) => {
    try {
        console.log(req.body);
        const { id, status } = req.body;
        const connection = req.transactionConnection;
        const result = await reviewClub(connection, id, status);
       if(result!=null){
        connection.commit((commitErr) => {
            connection.release();
            if (commitErr) {
                res.status(500).send('Error occurred');
            } else {
                res.send({success:true,message:'审核成功'});
            }
        });
       }else{
        res.send({success:false,message:'审核失败'});
       }
    } catch (error) {
        console.error('审核团长失败:', error);
        res.status(500).json({
            success: false,
            message: '审核团长失败'
        });
    }
  });
module.exports = router;