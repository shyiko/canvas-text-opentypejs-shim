// https://github.com/shyiko/canvas-text-opentypejs-shim
//
// To execute locally (Node.js >= 6):
// npm init -f && npm i canvas@1.6.2 opentype.js@0.6.6 node-fetch@1.6.3
// node demo-runkit.js

const NodeCanvas = require('canvas')
const opentype = require('opentype.js')
const fetch = require('node-fetch')
const fs = require('fs')
const applyCanvasTextOpenTypeJsShim =
  (() => { try { return require('../canvas-text-opentypejs-shim') } catch (e) {} })() ||
  require('canvas-text-opentypejs-shim')

fetch('https://fonts.gstatic.com/s/roboto' +
  '/v15/QHD8zigcbDB8aPfIoaupKOvvDin1pK8aKteLpeZ5c0A.ttf')
  .then((res) => new Promise((resolve, reject) => {
    res.body
      .on('error', reject)
      .pipe(fs.createWriteStream('Roboto.ttf'))
      .on('error', reject)
      .on('finish', resolve)
  }))
  .then(() => {
    const font = opentype.loadSync('Roboto.ttf')

    const canvas = new NodeCanvas(200, 200)
    const ctx = canvas.getContext('2d')
    applyCanvasTextOpenTypeJsShim(ctx, {
      resolveFont: function (o) {
        if (o.fontFamily === 'Roboto') {
          return font
        }
      }
    })

    ctx.font = '26px Roboto'
    ctx.fillText('Hello World', 0, 26)

    console.log(canvas.toBuffer())
  })

