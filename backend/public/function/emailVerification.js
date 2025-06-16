const nodemailer = require('nodemailer');

async function sendEmail(to) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.163.com',
        port: 465,
        secure: true,
        auth: {
            user: 'kiva20030808@163.com',
            pass: 'LYvg8389peBrGveL' // 这里使用邮箱的授权码，而不是邮箱密码
        }
    });

    // 存储验证码和邮箱对应关系
    const otpMap = new Map();

    // 生成验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 存储验证码和邮箱对应关系
    otpMap.set(to, code);

    const mailOptions = {
        from: '"积分系统" <kiva20030808@163.com>',
        to: to,
        subject: '注册验证码',
        text: `您的验证码是：${code}，有效期为5分钟，请勿泄露给他人。`,
        html: `
            <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
                <h2 style="color: #1890ff; margin-bottom: 20px;">积分系统 - 验证码</h2>
                <p style="font-size: 16px; color: #333;">您好！</p>
                <p style="font-size: 16px; color: #333;">您的验证码是：</p>
                <div style="background-color: #e6f7ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <span style="font-size: 24px; font-weight: bold; color: #1890ff;">${code}</span>
                </div>
                <p style="font-size: 14px; color: #666;">验证码有效期为5分钟，请勿泄露给他人。</p>
                <p style="font-size: 12px; color: #999; margin-top: 30px;">此邮件为系统自动发送，请勿回复。</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('邮件发送成功:', info.response);
        return {
            success: true,
            message: '验证码已发送',
            code: code
        };
    } catch (error) {
        console.error('邮件发送失败:', error);
        return {
            success: false,
            message: '验证码发送失败，请稍后重试'
        };
    }
}

module.exports = { sendEmail };