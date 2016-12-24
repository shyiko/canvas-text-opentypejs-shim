# canvas-text-opentypejs-shim

Text rendering shim for `<canvas>` backed by [opentype.js](https://github.com/nodebox/opentype.js). It allows you to get consistent results regardless of the OS, browser and the environment (Node.js). Works great with [kangax/fabric.js](https://github.com/kangax/fabric.js).

## Installation

Get it directly from NPM:

```sh
npm i --save canvas-text-opentypejs-shim
```

or through unpkg:

`<script src="https://unpkg.com/canvas-text-opentypejs-shim@0.1.0></script>`  
(in this case shim will be available as `window['canvas-text-opentypejs-shim']`).


## Usage

```javascript
const useOpenTypeJsForText = require('canvas-text-opentypejs-shim')

const canvas ...
const ctx = canvas.getContext('2d')

useOpenTypeJsForText(ctx, {resolveFont: (o) => opentypeFontInstance})

ctx.font = '26px Roboto'
ctx.fillText(text, 50, 50)
```

[Live Demo @ JS Bin](http://jsbin.com/gist/caa8be675e6dafee47c76a004202258d?html,output).  

[Live Demo (using kangax/fabric.js) @ JS Bin](http://jsbin.com/gist/82369ed3ec7ab0edfb8006da69b3b93a?html,output).

[Live Demo (using automattic/node-canvas) @ RunKit](http://runkit.com/shyiko/canvas-text-opentypejs-shim). Node.js

[Demo (using kangax/fabric.js)](demo/demo-runkit-fabric.js). Node.js

## License

[MIT](https://opensource.org/licenses/mit-license.php)
