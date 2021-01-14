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

const textToTranslations = async s => {
    const words = textToWords(s)
    const cacheResults = await Promise.all(words.map(getFromCache))
    const r = await partitionCachedUncached(cacheResults)

    const parsedResults = (await Promise.all(r.uncachedAsQueries.map(makeRequest)))
        .map(parseRequest)

    parsedResults.map(cacheParsedRequest)
    console.log(parsedResults.map(parsedRequestToCSV))
    console.log(r.cachedAsCSV)
    return parsedResults.map(parsedRequestToCSV) + '\n' + r.cachedAsCSV
}

const partitionCachedUncached = async cacheResults => {
    const [cached, uncached] = partition(r => r.wasCached, cacheResults)
    const cachedAsCSV = cached.map(c => c.result.text + ',' + c.result.translation).join('\n')
    const uncachedAsQueries = wordsToQueries(uncached.map(prop('word')))
    
    return { cachedAsCSV, uncachedAsQueries }
}

// textToTranslations('Hund Pferd Schwein Schweinchen Hahn Fisch Kaninchen Meerschweinchen')
// textToTranslations('Hund Pferd Schwein Schweinchen Hahn Fisch Kaninchen Meerschweinchen')

async function makeRequest(q) {
    console.log('making the request!', q)
    const response = await axios.get(process.env.WEBIT_URL, {
        params: {
            q,
            from: 'de',
            to: 'en',
            force_v2: 'true',
            webit_magic_key: 'UNKPMGYKGLPDWRJ3'
        },
        // required headers for rapidapi
        headers: {
            'x-rapidapi-host': 'webit-language.p.rapidapi.com',
            'x-rapidapi-key': process.env.WEBIT_API_KEY
        }
    })
    const apiResponse = new ApiResponse(response.data)
    apiResponse.save().catch(console.log)

    return response.data
}

const parseRequest = r => r.data
    .map(t => [
        addArticle.de(t.term),
        (t.translations.length == 1
            ? t.translations[0].translation
            : t.translations
                .filter(e => e.confidence > 0.5 || e.is_reliable)
                .sort((a, b) => b.confidence - a.confidence)
                .map(e => e.translation).join(' | ')
        )]
    )

const cacheParsedRequest = r => {
    r.forEach(t => {
        const word = new Word({
            source: 'de',
            dest: 'en',
            text: t[0],
            translation: t[1]
        })
        word.save().catch(console.log)
    })
}

const parsedRequestToCSV = r => r.map(t => t.join(',')).join('\n')

module.exports = textToTranslations