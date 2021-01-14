// library dependencies
const axios = require('axios')
const { partition, is, splitEvery, prop, } = require('ramda')

// language dependencies
const woerter = new Set(require('./woerter.json'))
const addArticle = require('./controllers/addArticle')

// mongoose dependencies
const mongoose = require('mongoose')
const Word = mongoose.model('Word')
const ApiResponse = mongoose.model('ApiResponse')

const uniq = arr => Array.from(new Set(arr))

const textToWords = s =>
    uniq(
        s.split(/\s/)
        .map(w => w.replace(/[^a-z]/gi, ''))
    )
    .filter(w => woerter.has(w))

const wordsToQueries = ws => splitEvery(Number(process.env.WORDS_PER_QUERY), ws).map(te => te.join(','))

const getFromCache = async w => {
    const response = await Word.findOne({ source: 'de', dest: 'en', text: addArticle.de(w) })
    return {
        word: w,
        result: response,
        wasCached: !!response
    }
}

const partitionCachedUncached = async cacheResults => {
    const [cached, uncached] = partition(r => r.wasCached, cacheResults)
    const cachedAsCSV = cached.map(c => c.result.text + ',' + c.result.translation).join('\n')
    const uncachedAsQueries = wordsToQueries(uncached.map(prop('word')))
    
    return { cachedAsCSV, uncachedAsQueries }
}
