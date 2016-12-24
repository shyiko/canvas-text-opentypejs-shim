// https://github.com/shyiko/canvas-text-opentypejs-shim
//
// To execute locally (Node.js >= 6):
// npm init -f && npm i canvas@1.6.2 opentype.js@0.6.6 node-fetch@1.6.3
// node demo-runkit.js

const NodeCanvas = require('canvas')
const opentype = require('opentype.js')
const fetch = require('node-fetch')
const fs = require('fs')
const useOpenTypeJsForText =
  (() => { try { return require('../canvas-text-opentypejs-shim') } catch (e) {} })() ||
  require('canvas-text-opentypejs-shim')

/**
 * @param fontFamily e.g. "'Open Sans', sans-serif"
 * @return e.g. ["Open Sans", "sans-serif"]
 */
function splitFontFamily (fontFamily) {
  return fontFamily.split(',')
    .map((f) => f.trim().replace(/^['"]/, '').replace(/['"]$/, ''))
    .filter(Boolean)
}

fetch('https://rawgit.com/google/fonts/master/apache/' +
    'opensans/OpenSans-Regular.ttf')
  .then((res) => new Promise((resolve, reject) => {
    res.body
      .on('error', reject)
      .pipe(fs.createWriteStream('OpenSans-Regular.ttf'))
      .on('error', reject)
      .on('finish', resolve)
  }))
  .then(() => {
    const font = opentype.loadSync('OpenSans-Regular.ttf')

    const canvas = new NodeCanvas(200, 200)
    const ctx = canvas.getContext('2d')
    useOpenTypeJsForText(ctx, {
      resolveFont: function (o) {
        if (splitFontFamily(o.fontFamily)[0] === 'Open Sans') {
          return font
        }
      }
    })

    ctx.font = '26px "Open Sans"'
    ctx.fillText('Hello World', 0, 26)

    console.log(`<img src="data:image/png;base64,${canvas.toBuffer().toString('base64')}">`)
  })

