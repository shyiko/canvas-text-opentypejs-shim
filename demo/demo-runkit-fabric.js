// https://github.com/shyiko/canvas-text-opentypejs-shim
//
// To execute locally (Node.js >= 6):
// npm init -f && npm i canvas@1.6.2 opentype.js@0.6.6 node-fetch@1.6.3 fabric@1.7.2
// node demo-runkit-fabric.js

const fabric = require('fabric').fabric
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

    const canvas = fabric.createCanvasForNode(this.width, this.height)
    applyCanvasTextOpenTypeJsShim(canvas.contextContainer, {
      resolveFont: function (o) {
        if (o.fontFamily.trim().replace(/^['"]/, '').replace(/['"]$/, '') === 'Roboto') {
          return font
        }
      }
    })

    canvas.add(new fabric.Text('Hello World', {
      left: 0, top: 0, fontFamily: 'Roboto', fontSize: 26
    }))

    console.log(`<img src="${canvas.toDataURL()}">`)
  })
