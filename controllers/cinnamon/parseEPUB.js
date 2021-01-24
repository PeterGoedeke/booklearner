// library dependencies
const { parseEpub } = require('@gxl/epub-parser')
const striptags = require('striptags')
const fs = require('fs').promises

const epubPathToText = async path => {
    const file = await fs.readFile(path)
    const epub = await parseEpub(file)

    return epub.sections
        .map(section => striptags(section.htmlString))
        .reduce((acc, cur) => acc + cur)
}

module.exports = epubPathToText