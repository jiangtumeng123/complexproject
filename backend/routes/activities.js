const express = require('express');
const router = express.Router();
const { getActivityById, getActivityParticipants, updateActivity, deleteActivity, getActivityCheckInStatus } = require('../public/function/activities');

// ... existing code ...

// 查询用户签到情况
router.get('/check-in-status/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const status = await getActivityCheckInStatus(userId);
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('查询签到状态失败:', error);
        res.status(500).json({
            success: false,
            message: '查询签到状态失败'
        });
    }
});

module.exports = router; 