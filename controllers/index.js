const Word = require('mongoose').model('Word')

async function getWords(req, res) {
    console.log(req.params.list);

    const words = await Word.find({ list: req.params.list })
    const readyWords = words.filter(w => w.ready > Date.now())

    return res.status(200).json({ words: readyWords })
}

module.exports = {
    getWords
}