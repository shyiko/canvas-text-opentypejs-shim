(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory()
  } else {
    root['canvas-text-opentypejs-shim'] = factory()
  }
}(this, function () {
  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/font
   *
   * @param font {string} CSS font specifier ("[style] [variant] [weight]
   * [stretch] size[/line-height] family")
   * @return {{
   *   fontStyle: 'normal' | 'italic' | 'oblique',
   *   fontVariant: string,
   *   fontWeight: 'normal' | 'bold' | 'bolder' | 'lighter' |
   *     '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900',
   *   fontStretch: 'normal' | 'ultra-condensed' | 'extra-condensed' |
   *    'condensed' | 'semi-condensed' | 'semi-expanded' | 'expanded' |
   *    'extra-expanded' | 'ultra-expanded',
   *   fontSize: string,
   *   lineHeight: string,
   *   fontFamily: string
   * }}
   */
  function parseCSSFont (font) {
    var fontFamilyFallbackIndex = font.indexOf(',')
    var fontFamilyFallback = ~fontFamilyFallbackIndex
      ? font.slice(fontFamilyFallbackIndex) : ''
    var fontWithoutFontFamilyFallback = ~fontFamilyFallbackIndex
      ? font.slice(0, fontFamilyFallbackIndex) : font
    var split = fontWithoutFontFamilyFallback.split(' ')
      .reduce(function (arr, v) {
        var part = v.trim()
        if (part) {
          arr.push(part)
          if (part.charAt(part.length - 1) === '"') {
            for (var i = arr.length - 1; i > -1; i--) {
              if (!arr[i].indexOf('"')) {
                return arr.slice(0, i).concat(arr.slice(i).join(' '))
              }
            }
          }
        }
        return arr
      }, [])
    var fontTokens = split
      .slice(0, -2).concat('normal', 'normal', 'normal', 'normal').slice(0, 4)
      .concat(split.slice(-2))
    var fontSize = fontTokens[4]
    var lineHeightIndex = fontSize.indexOf('/')
    return {
      fontStyle: fontTokens[0],
      fontVariant: fontTokens[1],
      fontWeight: fontTokens[2],
      fontStretch: fontTokens[3],
      fontSize: ~lineHeightIndex
        ? fontSize.slice(0, lineHeightIndex) : fontSize,
      lineHeight: ~lineHeightIndex
        ? fontSize.slice(lineHeightIndex + 1) : 'normal',
      fontFamily: fontTokens[5] + fontFamilyFallback
    }
  }

  /**
   * @see https://html.spec.whatwg.org/multipage/scripting.html#textmetrics
   *
   * @param text {string} The text to measure.
   * @param font {opentype.Font}
   * @param fontSize {number} in px
   * @return {TextMetrics}
   */
  function measureText (text, font, fontSize) {
    var ascent = 0
    var descent = 0
    var width = 0
    var glyphs = font.stringToGlyphs(text)
    for (var i = 0; i < glyphs.length; i++) {
      var glyph = glyphs[i]
      if (glyph.advanceWidth) {
        width += glyph.advanceWidth
      }
      if (i < glyphs.length - 1) {
        width += font.getKerningValue(glyph, glyphs[i + 1])
      }
      if (glyph.yMax) {
        ascent = Math.max(ascent, glyph.yMax)
      }
      if (glyph.yMin) {
        descent = Math.min(descent, glyph.yMin)
      }
    }
    var scale = 1 / font.unitsPerEm * fontSize
    return {
      width: width * scale,
      actualBoundingBoxAscent: ascent * scale,
      actualBoundingBoxDescent: descent * scale,
      fontBoundingBoxAscent: font.ascender * scale,
      fontBoundingBoxDescent: font.descender * scale
    }
  }

  /**
   * @param ctx {CanvasRenderingContext2D}
   * @param o.resolveFont {
   *   function({
   *     fontStyle: string,
   *     fontVariant: string,
   *     fontWeight: string,
   *     fontStretch: string,
   *     fontFamily: string
   *   }): opentype.Font
   * } locate opentype.js Font instance
   * @param [o.strict] {boolean} indicates whether or not to fallback to native
   * implementation whenever font cannot be found. "true" by default (which
   * means an error will be thrown if resolveFont returned null/undefined).
   */
  return function (ctx, o) {
    var strict = typeof o.strict === 'boolean' ? o.strict : true
    var font
    var fontSize
    var fontObject
    var active = true
    function drawText (text, left, top, maxWidth, outline) {
      var baselineTop = top
      var alignLeft = left
      // https://www.w3.org/TR/2001/REC-xsl-20011015/slice7.html (7.13)
      if (ctx.textBaseline !== 'alphabetic' ||
         (ctx.textAlign !== 'start' && ctx.textAlign !== 'left')) {
        var m = measureText(text, fontObject, fontSize)
        if (ctx.textBaseline === 'top') {
          baselineTop += m.actualBoundingBoxAscent - m.fontBoundingBoxDescent
        } else
        if (ctx.textBaseline === 'hanging') {
          baselineTop += m.actualBoundingBoxAscent
        } else
        if (ctx.textBaseline === 'middle') {
          baselineTop += m.actualBoundingBoxAscent / 2
        } else
        if (ctx.textBaseline === 'ideographic' || ctx.textBaseline === 'bottom') {
          baselineTop += m.fontBoundingBoxDescent
        }
        if (ctx.textAlign === 'right' || ctx.textAlign === 'end') {
          alignLeft -= m.width
        } else
        if (ctx.textAlign === 'center') {
          alignLeft -= m.width / 2
        }
      }
      var path = fontObject.getPath(text, alignLeft, baselineTop, fontSize)
      if (outline) {
        path.fill = null
        path.stroke = ctx.strokeStyle
      } else {
        path.fill = ctx.fillStyle
      }
      path.draw(ctx)
    }
    function setFont (v) {
      if (font !== v) {
        var cssFont = parseCSSFont(v)
        if (!/\d+px/.test(cssFont.fontSize)) {
          throw new Error('font-size must be in "px"')
        }
        fontObject = o.resolveFont(cssFont)
        if (!fontObject) {
          if (strict) {
            throw new Error(
              'Font instance wasn\'t found ("' + cssFont.fontFamily + '")')
          }
        }
        fontSize = parseInt(cssFont.fontSize, 10)
      }
      font = v
    }
    var originalMeasureText = ctx.measureText
    ctx.measureText = function (text) {
      if (active) {
        setFont(ctx.font)
        if (fontObject) {
          return measureText(text, fontObject, fontSize)
        }
      }
      return originalMeasureText.apply(this, arguments)
    }
    var originalFillText = ctx.fillText
    ctx.fillText = function (text, left, top, maxWidth) {
      if (active) {
        setFont(ctx.font)
        if (fontObject) {
          return drawText(text, left, top, maxWidth, false)
        }
      }
      return originalFillText.apply(this, arguments)
    }
    var originalStrokeText = ctx.strokeText
    ctx.strokeText = function (text, left, top, maxWidth) {
      if (active) {
        setFont(ctx.font)
        if (fontObject) {
          drawText(text, left, top, maxWidth, true)
        }
      }
      return originalStrokeText.apply(this, arguments)
    }
    return {
      enable: function (v) { active = !!v }
    }
  }
}))
