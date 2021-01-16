// library dependencies
const { curryN } = require('ramda')

// dictionary dependencies
const addArticle = require('./addArticle')

const parseRequest = curryN(2, (source, r) => r.data
    .map(t => [
        source == 'de' ? addArticle.de(t.term) : t.term,
        (t.translations.length == 1
            ? !t.translations[0].untranslatable
                ? t.translations[0].translation
                : null
            : t.translations
                .filter(e => e.confidence > 0.5 || e.is_reliable)
                .sort((a, b) => b.confidence - a.confidence)
                .map(e => e.translation).join(' | ')
        )]
    )
)

const parsedRequestToCSV = r => r.map(t => t.join(',')).join('\n')

module.exports = {
    parseRequest,
    parsedRequestToCSV
}