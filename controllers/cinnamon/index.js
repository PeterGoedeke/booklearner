// library dependencies
const axios = require('axios')
const { partition, prop, curryN } = require('ramda')

// dependencies from project
const { textToWords, wordsToQueries } = require('./parseText')
const { parseRequest, parsedRequestToCSV } = require('./parseRequest')
const { getFromCache, cacheParsedRequest } = require('./cache')

// mongoose dependencies
const mongoose = require('mongoose')
const ApiResponse = mongoose.model('ApiResponse')

const textToTranslations = async (s, source, dest) => {
    const words = textToWords(source, s)

    const cacheResults = (await Promise.all(words.map(getFromCache(source, dest))))
        .filter(word => !word.wasCached || word.result.translation)
    const r = await partitionCachedUncached(cacheResults)

    const parsedResults = (await Promise.all(r.uncachedAsQueries.map(makeRequest(source, dest))))
        .map(parseRequest(source))
    
    parsedResults.forEach(cacheParsedRequest(source, dest))
    const parsedResultsAsCSV = parsedResults
        .map(l => l.filter(r => r[1]))
        .map(parsedRequestToCSV)
        .join('\n')
    return parsedResultsAsCSV + '\n' + r.cachedAsCSV
}

const partitionCachedUncached = async cacheResults => {
    const [cached, uncached] = partition(r => r.wasCached, cacheResults)
    const cachedAsCSV = cached.map(c => c.result.text + ',' + c.result.translation).join('\n')
    const uncachedAsQueries = wordsToQueries(uncached.map(prop('word')))
    
    return { cachedAsCSV, uncachedAsQueries }
}

;(async function() {
    // console.log('hello', await textToTranslations('gehen Gehen hund Hund', 'de', 'en'))
    // console.log(await textToTranslations('yeetyeet Hund hund', 'de', 'en'))
})()

const makeRequest = curryN(3, async function (source, dest, q) {
    console.log(`Requesting word ${q} in ${source} to ${dest}`)
    try {
        const response = await axios.get(process.env.WEBIT_URL, {
            params: {
                q,
                from: source,
                to: dest,
                force_v2: true,
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
    catch (e) {
        console.warn(e)
    }
})

module.exports = textToTranslations