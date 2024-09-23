const logger = {
    log: function (content) {
        console.log(`[${new Date().toLocaleString('zh', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replaceAll('\/', '-')}] LOG ${content}`)
    },

    info: function (content) {
        console.info(`[${new Date().toLocaleString('zh', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replaceAll('\/', '-')}] INFO ${content}`)
    },

    warn: function (content) {
        console.warn(`[${new Date().toLocaleString('zh', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replaceAll('\/', '-')}] WARN ${content}`)
    },

    error: function (content) {
        console.error(`[${new Date().toLocaleString('zh', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replaceAll('\/', '-')}] ERROR ${content}`)
    }
}

module.exports = logger