const qiniu = require('qiniu');
const logger = require('./logger');

const bucket = process.env.QINIU_BUCKET;
const accessKey = process.env.QINIU_AK;
const secretKey = process.env.QINIU_SK;
const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
const options = {
    scope: bucket,
    fsizeLimit: 2 * 1024 * 1024,
    returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize)}',
};
const putPolicy = new qiniu.rs.PutPolicy(options);

const uploadToken = putPolicy.uploadToken(mac);
const config = new qiniu.conf.Config();
const formUploader = new qiniu.form_up.FormUploader(config);
const putExtra = new qiniu.form_up.PutExtra();


/**
 * 上传文件
 *
 * @param {Buffer} file 文件内容
 * @param {String} fileName 文件名
 * @return {Promise<Object>} 上传结果
 * @author ChiyukiRuon
 * */
const uploadFile = async (file, fileName) => {
    return new Promise((resolve, reject) => {
        formUploader.put(uploadToken, fileName, file, putExtra, (err, body, info) => {
            if (err) {
                logger.error(`Upload file failed: ${err}`);
                return reject({
                    success: false,
                    data: err
                });
            }
            if (info.statusCode === 200) {
                logger.info('Upload successful:', body);
                resolve({
                    success: true,
                    data: body
                });
            } else {
                logger.error(`Upload file failed with status ${info.statusCode}: ${body}`);
                reject({
                    success: false,
                    data: body
                });
            }
        });
    });
};

module.exports = {
    uploadFile
}