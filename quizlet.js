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

const addArticle = w => {
    try {
        const gender = words.getGenderGermanWord(null, list, w)
        if (gender == 'M') {
            return 'der ' + w
        }
        else if (gender == 'F') {
            return 'die ' + w
        }
        else {
            return 'das ' + w
        }
    }
    catch (e) {
        return w
    }
}

const parse = r => r.data
    .map(t => 
        addArticle(t.term)
        + ','
        + (t.translations.length == 1
            ? t.translations[0].translation
            : t.translations
                .filter(e => e.confidence > 0.8)
                .sort((a, b) => {
                    console.log(a.confidence, a.confidence,  isNaN(a.confidence))
                    return b.confidence - a.confidence
                })
                .map(e => e.translation + ' ' + e.confidence).join(' | ')
    )).join('\n')
