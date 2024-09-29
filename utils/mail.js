const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.exmail.qq.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_ACCOUNT,
        pass: process.env.EMAIL_PASSWORD
    }
})

const TEMPLATES = {
    apply: (data) => ({
        subject: '商家申请提交成功',
        html: `
            <p>您的商家申请已提交成功，我们会在 1-2 个工作日内审核，审核通过后会通过邮件通知您。</p>
            <p>账户：<span>${data.username}</span></p>
            <p>您可以访问 <a href="https://dianping.chiyukiruon.top/merchant/status">审核进度</a> 查看审核进度。</p>
        `
    }),
    approve: (data) => ({
        subject: '商家申请审核结果',
        html: `
            <p>您的商家申请已审核完毕，审核结果如下：</p>
            <p>账户：<span>${data.username}</span></p>
            <p>审核结果：<span style="color: #00ff00">审核通过</span></p>
            <p>审核备注：${data.remark || '无'}</p>
            <p>您可以登录 <a href="https://dianping.chiyukiruon.top/merchant/dashboard">控制台</a> 管理您的店铺。</p>
        `
    }),
    reject: (data) => ({
        subject: '商家申请审核结果',
        html: `
            <p>您的商家申请已审核完毕，审核结果如下：</p>
            <p>账户：<span>${data.username}</span></p>
            <p>审核结果：<span style="color: #ff0000">审核不通过</span></p>
            <p>审核备注：${data.remark || '无'}</p>
            <p>您可以访问 <a href="https://dianping.chiyukiruon.top/merchant/apply">商家申请</a> 重新提交申请。</p>
        `
    })
}

/**
 * 发送邮件
 *
 * @param {String} to 收件人邮件地址
 * @param {String} subject 邮件标题
 * @param {String} html 邮件内容
 * @param {String} template 邮件模板
 * @param {Object} data 邮件模板数据
 * @return {Promise<Object>} 邮件发送的结果
 * @author ChiyukiRuon
 */
const sendMail = async (to, subject, html, template = '', data = {}) => {
    if (template) {
        try {
            let info = await transporter.sendMail({
                from: '小众点评 <dianping@chiyukiruon.top>',
                to: to,
                subject: TEMPLATES[template](data).subject,
                html: TEMPLATES[template](data).html
            })

            return { success: true, messageId: info.messageId }
        } catch (error) {
            return { success: false, error: error }
        }
    } else {
        try {
            let info = await transporter.sendMail({
                from: '小众点评 <dianping@chiyukiruon.top>',
                to: to,
                subject: subject,
                html: html
            })

            return { success: true, messageId: info.messageId }
        } catch (error) {
            return { success: false, error: error }
        }
    }
}

module.exports = {
    sendMail
}
