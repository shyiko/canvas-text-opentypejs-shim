// https://github.com/shyiko/canvas-text-opentypejs-shim
//
// To execute locally (Node.js >= 6):
// npm init -f && npm i canvas@1.6.2 opentype.js@0.6.6 node-fetch@1.6.3 fabric@1.7.2
// node demo-runkit-fabric.js

const fabric = require('fabric').fabric
const opentype = require('opentype.js')
const fetch = require('node-fetch')
const fs = require('fs')
const useOpenTypeJsForText =
  (() => { try { return require('../canvas-text-opentypejs-shim') } catch (e) {} })() ||
  require('canvas-text-opentypejs-shim')

// this way fabric tends to yield more consistent results when compared to
// CanvasRenderingContext2D.drawText
fabric.Text.prototype._fontSizeMult = 1.25

/**
 * @param fontFamily e.g. "'Open Sans', sans-serif"
 * @return e.g. ["Open Sans", "sans-serif"]
 */
function splitFontFamily (fontFamily) {
  return fontFamily.split(',')
    .map((f) => f.trim().replace(/^['"]/, '').replace(/['"]$/, ''))
    .filter(Boolean)
}

// making sure whatever context is used to measure/draw text it has shim active
// (given openTypeJsShimConfig was provided)
fabric.Text.prototype._setTextStyles = (function (original) {
  return function (ctx) {
    var cfg = this.openTypeJsShimConfig
    if (cfg && !ctx.measureText.__openTypeJsShimConfig) {
      useOpenTypeJsForText(ctx, cfg)
      ctx.measureText.__openTypeJsShimConfig = cfg
    }
    return original.call(this, ctx)
  }
})(fabric.Text.prototype._setTextStyles)

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

    const ctx = fabric.createCanvasForNode(200, 200)
    const shimConfig = {
      resolveFont: function (o) {
        if (splitFontFamily(o.fontFamily)[0] === 'Open Sans') {
          return font
        }
      }
    }

    ctx.add(new fabric.Text('Hello World', {
      left: -0.5, top: -0.5, fontFamily: 'Open Sans', fontSize: 26,
      openTypeJsShimConfig: shimConfig
    }))

    console.log(`<img src="${ctx.toDataURL()}">`)
  })
