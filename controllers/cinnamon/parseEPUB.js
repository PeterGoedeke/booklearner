// library dependencies
const { parseEpub } = require('@gxl/epub-parser')
const striptags = require('striptags')
const fs = require('fs').promises

// dictionary dependencies
const { textToWords } = require('./parseText')

const epubPathToWords = async (source, path) => {
    const file = await fs.readFile(path)
    const epub = await parseEpub(file)
    // epub.sections.forEach(section => {
    //     console.log(textToWords(source, striptags(section.htmlString)))
    // })
    // console.log(concat(epub.sections.map(section => textToWords(source, striptags(section.htmlString)))))
    return epub.sections
        .map(section => textToWords(source, striptags(section.htmlString)))
        .reduce((acc, cur) => acc.concat(cur))
}

module.exports = epubPathToWords