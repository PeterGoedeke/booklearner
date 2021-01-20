// library dependencies
const axios = require('axios')
const { partition, prop, curryN } = require('ramda')
const util = require('util')

// dependencies from project
const { wordsToQueries } = require('./parseText')
const { parseRequest, parsedRequestToCSV } = require('./parseRequest')
const { getFromCache, cacheParsedRequest } = require('./cache')

// mongoose dependencies
const mongoose = require('mongoose')
const ApiResponse = mongoose.model('ApiResponse')

const wordsToTranslations = async (words, source, dest) => {
    try {
        const cacheResults = (await Promise.all(words.map(getFromCache(source, dest))))
            .filter(word => !word.wasCached || word.result.translation)

        const r = partitionCachedUncached(cacheResults)
        
        try {
            const responses = await Promise.all(r.uncachedAsQueries.map(
                (v, i) => makeRequest(i * 500, source, dest, v)
            ))

            const parsedResults = responses.map(parseRequest(source))

            parsedResults.forEach(cacheParsedRequest(source, dest))
            const parsedResultsAsCSV = parsedResults
                .map(l => l.filter(r => r[1]))
                .filter(l => l.length != 0)
                .map(parsedRequestToCSV)
                .join('\n')
            return parsedResultsAsCSV.length != 0
                ? parsedResultsAsCSV + '\n' + r.cachedAsCSV
                : r.cachedAsCSV
        }
        catch (e) {
            console.log(e)
            return {
                error: true,
                status: 502,
                type: 'gateway',
                message: e
            }
        }            
    }
    catch (e) {
        console.log(e)
        return {
            error: true,
            status: 500,
            type: 'cache',
            message: e
        }
    }
}

const partitionCachedUncached = cacheResults => {
    const [cached, uncached] = partition(r => r.wasCached, cacheResults)
    const cachedAsCSV = cached.map(c => c.result.text + ',' + c.result.translation).join('\n')
    const uncachedAsQueries = wordsToQueries(uncached.map(prop('word')))
    
    return { cachedAsCSV, uncachedAsQueries }
}

;(async function() {
    // console.log('hello', await textToTranslations('gehen Gehen hund Hund', 'de', 'en'))
    // console.log(await textToTranslations('yeetyeet Hund hund', 'de', 'en'))
})()
const delay = util.promisify(setTimeout)

const makeRequest = curryN(4, async function (time, source, dest, q) {
    console.log('setting delay of ' + time + ' milliseconds')
    await delay(time)
    console.log(`Requesting word ${q} in ${source} to ${dest}`)
    const response = await axios.get(process.env.WEBIT_URL, {
        params: {
            q,
            from: source,
            to: dest,
            force_v2: true,
            webit_magic_keys: '7SV4RH1S0PWA4Z0U'
        },
        // required headers for rapidapi
        headers: {
            'x-rapidapi-host': 'webit-language.p.rapidapi.com',
            'x-rapidapi-key': process.env.WEBIT_API_KEY
        }
    })
    // console.log(response.data)
    const apiResponse = new ApiResponse(response.data)
    apiResponse.save().catch(err => {
        console.log('api response save error')
        console.log(err)
        console.log(response.data)
        console.log(typeof response.data)
    })
    return response.data
})

module.exports = wordsToTranslations