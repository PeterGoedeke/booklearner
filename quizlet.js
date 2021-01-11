require('dotenv').config()
const axios = require('axios')

const woerter = new Set(require('./routes/woerter.json'))
const words = require('german-words')
const list = require('german-words-dict')

async function makeRequest(q) {
    console.log('yeet');
    const response = await axios.get(process.env.WEBIT_URL, {
        params: {
            q,
            from: 'de',
            to: 'en'
        },
        // required headers for rapidapi
        headers: {
            'x-rapidapi-host': 'webit-language.p.rapidapi.com',
            'x-rapidapi-key': process.env.WEBIT_API_KEY
        }
    })
    return response.data
}

const uniq = arr => Array.from(new Set(arr))

const tstr = s =>
    uniq(s.split(/\s/)
    .map(w => w.replace(/[^a-z]/gi, '')))
    .filter(w => woerter.has(w))
    .join(',')
