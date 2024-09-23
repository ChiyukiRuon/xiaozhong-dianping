const NodeRSA = require('node-rsa')
const fs = require('fs')
const logger = require("./logger");

const generateKeyPair = () => {
    const key = new NodeRSA({ b: 512 })

    const publicKey = key.exportKey('public')
    const privateKey = key.exportKey('private')

    if (!fs.existsSync('./keys')) fs.mkdirSync('./keys')

    fs.writeFileSync('./keys/public.key', publicKey)
    fs.writeFileSync('./keys/private.key', privateKey)

    console.log('Key Pair Generated')
}

const decryptData = (encryptedData) => {
    try {
        const privateKey = fs.readFileSync('./keys/private.key', 'utf8')
        const key = new NodeRSA(privateKey)

        key.setOptions({encryptionScheme: 'pkcs1'});

        return key.decrypt(encryptedData, 'utf8')
    } catch (e) {
        logger.error(e)
        return false
    }
}

module.exports = {
    generateKeyPair,
    decryptData
}