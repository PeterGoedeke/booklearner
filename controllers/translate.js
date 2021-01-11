const axios = require('axios').default
const mongoose = require('mongoose')
const { filter, prop } = require('ramda')
const LinkResponse = mongoose.model('LinkResponse')
const Word = mongoose.model('Word')
const fs = require('fs')

const codeMap = {
    pt: 'por',
    de: 'deu',
    ru: 'rus',
    cn: 'chi',
    es: 'spa',
    it: 'ita',
    nl: 'nld',
    pl: 'pol',
    cs: 'ces',
    jp: 'jpn',
    se: 'swe',
    fi: 'fin',
    hu: 'hun',
    ar: 'arb',
    tr: 'tur',
    bn: 'ben',
    hi: 'hin',
    ko: 'kor',
    th: 'tha',
    fr: 'fra',
    en: 'eng'
}

async function retrieveTranslations(q, source, dest) {
    try {
        const params = [
            codeMap[source],
            codeMap[dest],
            q
        ]
        const response = await axios.get(process.env.LINK_URL + params.join('/'), {
            headers: {
                'x-rapidapi-key': process.env.LINK_KEY,
                'x-rapidapi-host': 'link-bilingual-dictionary.p.rapidapi.com',
                useQueryString: true
            },
        })
        // change this to upsert
        // set the write concern to 0
        const linkResponse = new LinkResponse(response.data)
        linkResponse.save().catch(console.log)
        
        return filter(x => prop('frequency', x) > 1, response.data.results)
    }
    catch (err) {
        console.log(err);
    }
}

module.exports = {
    retrieve: retrieveTranslations
}