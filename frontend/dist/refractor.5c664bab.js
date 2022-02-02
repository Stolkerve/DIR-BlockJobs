// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"../node_modules/refractor/lang/apex.js":[function(require,module,exports) {
'use strict'
var refractorSql = require('./sql.js')
module.exports = apex
apex.displayName = 'apex'
apex.aliases = []
function apex(Prism) {
  Prism.register(refractorSql)
  ;(function (Prism) {
    var keywords =
      /\b(?:abstract|activate|and|any|array|as|asc|autonomous|begin|bigdecimal|blob|boolean|break|bulk|by|byte|case|cast|catch|char|class|collect|commit|const|continue|currency|date|datetime|decimal|default|delete|desc|do|double|else|end|enum|exception|exit|export|extends|final|finally|float|for|from|global|goto|group|having|hint|if|implements|import|in|inner|insert|instanceof|int|integer|interface|into|join|like|limit|list|long|loop|map|merge|new|not|null|nulls|number|object|of|on|or|outer|override|package|parallel|pragma|private|protected|public|retrieve|return|rollback|select|set|short|sObject|sort|static|string|super|switch|synchronized|system|testmethod|then|this|throw|time|transaction|transient|trigger|try|undelete|update|upsert|using|virtual|void|webservice|when|where|while|get(?=\s*[{};])|(?:after|before)(?=\s+[a-z])|(?:inherited|with|without)\s+sharing)\b/i
    var className =
      /\b(?:(?=[a-z_]\w*\s*[<\[])|(?!<keyword>))[A-Z_]\w*(?:\s*\.\s*[A-Z_]\w*)*\b(?:\s*(?:\[\s*\]|<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>))*/.source.replace(
        /<keyword>/g,
        function () {
          return keywords.source
        }
      )
    /** @param {string} pattern */
    function insertClassName(pattern) {
      return RegExp(
        pattern.replace(/<CLASS-NAME>/g, function () {
          return className
        }),
        'i'
      )
    }
    var classNameInside = {
      keyword: keywords,
      punctuation: /[()\[\]{};,:.<>]/
    }
    Prism.languages.apex = {
      comment: Prism.languages.clike.comment,
      string: Prism.languages.clike.string,
      sql: {
        pattern: /((?:[=,({:]|\breturn)\s*)\[[^\[\]]*\]/i,
        lookbehind: true,
        greedy: true,
        alias: 'language-sql',
        inside: Prism.languages.sql
      },
      annotation: {
        pattern: /@\w+\b/,
        alias: 'punctuation'
      },
      'class-name': [
        {
          pattern: insertClassName(
            /(\b(?:class|enum|extends|implements|instanceof|interface|new|trigger\s+\w+\s+on)\s+)<CLASS-NAME>/
              .source
          ),
          lookbehind: true,
          inside: classNameInside
        },
        {
          // cast
          pattern: insertClassName(
            /(\(\s*)<CLASS-NAME>(?=\s*\)\s*[\w(])/.source
          ),
          lookbehind: true,
          inside: classNameInside
        },
        {
          // variable/parameter declaration and return types
          pattern: insertClassName(/<CLASS-NAME>(?=\s*\w+\s*[;=,(){:])/.source),
          inside: classNameInside
        }
      ],
      trigger: {
        pattern: /(\btrigger\s+)\w+\b/i,
        lookbehind: true,
        alias: 'class-name'
      },
      keyword: keywords,
      function: /\b[a-z_]\w*(?=\s*\()/i,
      boolean: /\b(?:false|true)\b/i,
      number: /(?:\B\.\d+|\b\d+(?:\.\d+|L)?)\b/i,
      operator:
        /[!=](?:==?)?|\?\.?|&&|\|\||--|\+\+|[-+*/^&|]=?|:|<<?=?|>{1,3}=?/,
      punctuation: /[()\[\]{};,.]/
    }
  })(Prism)
}

},{"./sql.js":"../node_modules/refractor/lang/sql.js"}],"../node_modules/refractor/lang/avisynth.js":[function(require,module,exports) {
'use strict'

module.exports = avisynth
avisynth.displayName = 'avisynth'
avisynth.aliases = ['avs']
function avisynth(Prism) {
  // http://avisynth.nl/index.php/The_full_AviSynth_grammar
  ;(function (Prism) {
    function replace(pattern, replacements) {
      return pattern.replace(/<<(\d+)>>/g, function (m, index) {
        return replacements[+index]
      })
    }
    function re(pattern, replacements, flags) {
      return RegExp(replace(pattern, replacements), flags || '')
    }
    var types = /clip|int|float|string|bool|val/.source
    var internals = [
      // bools
      /is(?:bool|clip|float|int|string)|defined|(?:var|(?:internal)?function)?exists?/
        .source, // control
      /apply|assert|default|eval|import|select|nop|undefined/.source, // global
      /set(?:memorymax|cachemode|maxcpu|workingdir|planarlegacyalignment)|opt_(?:allowfloataudio|usewaveextensible|dwchannelmask|avipadscanlines|vdubplanarhack|enable_(?:v210|y3_10_10|y3_10_16|b64a|planartopackedrgb))/
        .source, // conv
      /hex(?:value)?|value/.source, // numeric
      /max|min|muldiv|floor|ceil|round|fmod|pi|exp|log(?:10)?|pow|sqrt|abs|sign|frac|rand|spline|continued(?:numerator|denominator)?/
        .source, // trig
      /a?sinh?|a?cosh?|a?tan[2h]?/.source, // bit
      /(?:bit(?:and|not|x?or|[lr]?shift[aslu]?|sh[lr]|sa[lr]|[lr]rotatel?|ro[rl]|te?st|set(?:count)?|cl(?:ea)?r|ch(?:an)?ge?))/
        .source, // runtime
      /average(?:luma|chroma[uv]|[bgr])|(?:luma|chroma[uv]|rgb|[rgb]|[yuv](?=difference(?:fromprevious|tonext)))difference(?:fromprevious|tonext)?|[yuvrgb]plane(?:median|min|max|minmaxdifference)/
        .source, // script
      /script(?:name(?:utf8)?|file(?:utf8)?|dir(?:utf8)?)|setlogparams|logmsg|getprocessinfo/
        .source, // string
      /[lu]case|str(?:toutf8|fromutf8|len|cmpi?)|(?:rev|left|right|mid|find|replace|fill)str|format|trim(?:left|right|all)|chr|ord|time/
        .source, // version
      /version(?:number|string)|isversionorgreater/.source, // helper
      /buildpixeltype|colorspacenametopixeltype/.source, // avsplus
      /setfiltermtmode|prefetch|addautoloaddir|on(?:cpu|cuda)/.source
    ].join('|')
    var properties = [
      // content
      /has(?:audio|video)/.source, // resolution
      /width|height/.source, // framerate
      /frame(?:count|rate)|framerate(?:numerator|denominator)/.source, // interlacing
      /is(?:field|frame)based|getparity/.source, // color format
      /pixeltype|is(?:planar(?:rgba?)?|interleaved|rgb(?:24|32|48|64)?|y(?:8|u(?:y2|va?))?|yv(?:12|16|24|411)|420|422|444|packedrgb)|hasalpha|componentsize|numcomponents|bitspercomponent/
        .source, // audio
      /audio(?:rate|duration|length(?:[fs]|lo|hi)?|channels|bits)|isaudio(?:float|int)/
        .source
    ].join('|')
    var filters = [
      // source
      /avi(?:file)?source|opendmlsource|directshowsource|image(?:reader|source|sourceanim)|segmented(?:avisource|directshowsource)|wavsource/
        .source, // color
      /coloryuv|convertto(?:RGB(?:24|32|48|64)|(?:planar)?RGBA?|Y8?|YV(?:12|16|24|411)|YUVA?(?:444|422|420|411)|YUY2)|convertbacktoyuy2|fixluminance|gr[ae]yscale|invert|levels|limiter|mergea?rgb|merge(?:luma|chroma)|rgbadjust|show(?:red|green|blue|alpha)|swapuv|tweak|[uv]toy8?|ytouv/
        .source, // overlay
      /(?:colorkey|reset)mask|mask(?:hs)?|layer|merge|overlay|subtract/.source, // geometry
      /addborders|crop(?:bottom)?|flip(?:horizontal|vertical)|letterbox|(?:horizontal|vertical)?reduceby2|(?:bicubic|bilinear|blackman|gauss|lanczos|lanczos4|point|sinc|spline(?:16|36|64))resize|skewrows|turn(?:left|right|180)/
        .source, // pixel
      /blur|sharpen|generalconvolution|(?:spatial|temporal)soften|fixbrokenchromaupsampling/
        .source, // timeline
      /trim|(?:un)?alignedsplice|(?:assume|assumescaled|change|convert)FPS|(?:delete|duplicate)frame|dissolve|fade(?:in|out|io)[02]?|freezeframe|interleave|loop|reverse|select(?:even|odd|(?:range)?every)/
        .source, // interlace
      /assume(?:frame|field)based|assume[bt]ff|bob|complementparity|doubleweave|peculiarblend|pulldown|separate(?:columns|rows|fields)|swapfields|weave(?:columns|rows)?/
        .source, // audio
      /amplify(?:db)?|assumesamplerate|audiodub(?:ex)?|audiotrim|convertaudioto(?:(?:8|16|24|32)bit|float)|converttomono|delayaudio|ensurevbrmp3sync|get(?:left|right)?channel|kill(?:audio|video)|mergechannels|mixaudio|monotostereo|normalize|resampleaudio|supereq|ssrc|timestretch/
        .source, // conditional
      /conditional(?:filter|select|reader)|frameevaluate|scriptclip|writefile(?:if|start|end)?|animate|applyrange|tcp(?:server|source)/
        .source, // export
      /imagewriter/.source, // debug
      /subtitle|blankclip|blackness|colorbars(?:hd)?|compare|dumpfiltergraph|setgraphanalysis|echo|histogram|info|messageclip|preroll|showfiveversions|show(?:framenumber|smpte|time)|stack(?:horizontal|vertical)|tone|version/
        .source
    ].join('|')
    var allinternals = [internals, properties, filters].join('|')
    Prism.languages.avisynth = {
      comment: [
        {
          // Matches [* *] nestable block comments, but only supports 1 level of nested comments
          // /\[\*(?:[^\[*]|\[(?!\*)|\*(?!\])|<self>)*\*\]/
          pattern:
            /(^|[^\\])\[\*(?:[^\[*]|\[(?!\*)|\*(?!\])|\[\*(?:[^\[*]|\[(?!\*)|\*(?!\]))*\*\])*\*\]/,
          lookbehind: true,
          greedy: true
        },
        {
          // Matches /* */ block comments
          pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
          lookbehind: true,
          greedy: true
        },
        {
          // Matches # comments
          pattern: /(^|[^\\$])#.*/,
          lookbehind: true,
          greedy: true
        }
      ],
      // Handle before strings because optional arguments are surrounded by double quotes
      argument: {
        pattern: re(/\b(?:<<0>>)\s+("?)\w+\1/.source, [types], 'i'),
        inside: {
          keyword: /^\w+/
        }
      },
      // Optional argument assignment
      'argument-label': {
        pattern: /([,(][\s\\]*)\w+\s*=(?!=)/,
        lookbehind: true,
        inside: {
          'argument-name': {
            pattern: /^\w+/,
            alias: 'punctuation'
          },
          punctuation: /=$/
        }
      },
      string: [
        {
          // triple double-quoted
          pattern: /"""[\s\S]*?"""/,
          greedy: true
        },
        {
          // single double-quoted
          pattern: /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/,
          greedy: true,
          inside: {
            constant: {
              // These *are* case-sensitive!
              pattern:
                /\b(?:DEFAULT_MT_MODE|(?:SCRIPT|MAINSCRIPT|PROGRAM)DIR|(?:USER|MACHINE)_(?:PLUS|CLASSIC)_PLUGINS)\b/
            }
          }
        }
      ],
      // The special "last" variable that takes the value of the last implicitly returned clip
      variable: /\b(?:last)\b/i,
      boolean: /\b(?:true|false|yes|no)\b/i,
      keyword:
        /\b(?:function|global|return|try|catch|if|else|while|for|__END__)\b/i,
      constant: /\bMT_(?:NICE_FILTER|MULTI_INSTANCE|SERIALIZED|SPECIAL_MT)\b/,
      // AviSynth's internal functions, filters, and properties
      'builtin-function': {
        pattern: re(/\b(?:<<0>>)\b/.source, [allinternals], 'i'),
        alias: 'function'
      },
      'type-cast': {
        pattern: re(/\b(?:<<0>>)(?=\s*\()/.source, [types], 'i'),
        alias: 'keyword'
      },
      // External/user-defined filters
      function: {
        pattern: /\b[a-z_]\w*(?=\s*\()|(\.)[a-z_]\w*\b/i,
        lookbehind: true
      },
      // Matches a \ as the first or last character on a line
      'line-continuation': {
        pattern: /(^[ \t]*)\\|\\(?=[ \t]*$)/m,
        lookbehind: true,
        alias: 'punctuation'
      },
      number:
        /\B\$(?:[\da-f]{6}|[\da-f]{8})\b|(?:(?:\b|\B-)\d+(?:\.\d*)?\b|\B\.\d+\b)/i,
      operator: /\+\+?|[!=<>]=?|&&|\|\||[?:*/%-]/,
      punctuation: /[{}\[\]();,.]/
    }
    Prism.languages.avs = Prism.languages.avisynth
  })(Prism)
}

},{}],"../node_modules/refractor/lang/avro-idl.js":[function(require,module,exports) {
'use strict'

module.exports = avroIdl
avroIdl.displayName = 'avroIdl'
avroIdl.aliases = []
function avroIdl(Prism) {
  // GitHub: https://github.com/apache/avro
  // Docs: https://avro.apache.org/docs/current/idl.html
  Prism.languages['avro-idl'] = {
    comment: {
      pattern: /\/\/.*|\/\*[\s\S]*?\*\//,
      greedy: true
    },
    string: [
      {
        pattern: /(^|[^\\])"(?:[^\r\n"\\]|\\.)*"/,
        lookbehind: true,
        greedy: true
      },
      {
        pattern: /(^|[^\\])'(?:[^\r\n'\\]|\\(?:[\s\S]|\d{1,3}))'/,
        lookbehind: true,
        greedy: true
      }
    ],
    annotation: {
      pattern: /@(?:[$\w.-]|`[^\r\n`]+`)+/,
      greedy: true,
      alias: 'function'
    },
    'function-identifier': {
      pattern: /`[^\r\n`]+`(?=\s*\()/,
      greedy: true,
      alias: 'function'
    },
    identifier: {
      pattern: /`[^\r\n`]+`/,
      greedy: true
    },
    'class-name': {
      pattern: /(\b(?:enum|error|protocol|record|throws)\b\s+)[$\w]+/,
      lookbehind: true,
      greedy: true
    },
    keyword:
      /\b(?:array|boolean|bytes|date|decimal|double|enum|error|false|fixed|float|idl|import|int|local_timestamp_ms|long|map|null|oneway|protocol|record|schema|string|throws|time_ms|timestamp_ms|true|union|uuid|void)\b/,
    function: /\b[a-z_]\w*(?=\s*\()/i,
    number: [
      {
        pattern:
          /(^|[^\w.])-?(?:(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|0x(?:[a-f0-9]+(?:\.[a-f0-9]*)?|\.[a-f0-9]+)(?:p[+-]?\d+)?)[dfl]?(?![\w.])/i,
        lookbehind: true
      },
      /-?\b(?:NaN|Infinity)\b/
    ],
    operator: /=/,
    punctuation: /[()\[\]{}<>.:,;-]/
  }
  Prism.languages.avdl = Prism.languages['avro-idl']
}

},{}],"../node_modules/refractor/lang/bicep.js":[function(require,module,exports) {
'use strict'

module.exports = bicep
bicep.displayName = 'bicep'
bicep.aliases = []
function bicep(Prism) {
  // based loosely upon: https://github.com/Azure/bicep/blob/main/src/textmate/bicep.tmlanguage
  Prism.languages.bicep = {
    comment: [
      {
        // multiline comments eg /* ASDF */
        pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
        lookbehind: true,
        greedy: true
      },
      {
        // singleline comments eg // ASDF
        pattern: /(^|[^\\:])\/\/.*/,
        lookbehind: true,
        greedy: true
      }
    ],
    property: [
      {
        pattern: /([\r\n][ \t]*)[a-z_]\w*(?=[ \t]*:)/i,
        lookbehind: true
      },
      {
        pattern: /([\r\n][ \t]*)'(?:\\.|\$(?!\{)|[^'\\\r\n$])*'(?=[ \t]*:)/,
        lookbehind: true,
        greedy: true
      }
    ],
    string: [
      {
        pattern: /'''[^'][\s\S]*?'''/,
        greedy: true
      },
      {
        pattern: /(^|[^\\'])'(?:\\.|\$(?!\{)|[^'\\\r\n$])*'/,
        lookbehind: true,
        greedy: true
      }
    ],
    'interpolated-string': {
      pattern: /(^|[^\\'])'(?:\\.|\$(?:(?!\{)|\{[^{}\r\n]*\})|[^'\\\r\n$])*'/,
      lookbehind: true,
      greedy: true,
      inside: {
        interpolation: {
          pattern: /\$\{[^{}\r\n]*\}/,
          inside: {
            expression: {
              pattern: /(^\$\{)[\s\S]+(?=\}$)/,
              lookbehind: true
            },
            punctuation: /^\$\{|\}$/
          }
        },
        string: /[\s\S]+/
      }
    },
    datatype: {
      pattern: /(\b(?:output|param)\b[ \t]+\w+[ \t]+)\w+\b/,
      lookbehind: true,
      alias: 'class-name'
    },
    boolean: /\b(?:true|false)\b/,
    // https://github.com/Azure/bicep/blob/114a3251b4e6e30082a58729f19a8cc4e374ffa6/src/textmate/bicep.tmlanguage#L184
    keyword:
      /\b(?:targetScope|resource|module|param|var|output|for|in|if|existing|null)\b/,
    decorator: /@\w+\b/,
    function: /\b[a-z_]\w*(?=[ \t]*\()/i,
    number: /(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:E[+-]?\d+)?/i,
    operator:
      /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/,
    punctuation: /[{}[\];(),.:]/
  }
  Prism.languages.bicep['interpolated-string'].inside['interpolation'].inside[
    'expression'
  ].inside = Prism.languages.bicep
}

},{}],"../node_modules/refractor/lang/cfscript.js":[function(require,module,exports) {
'use strict'

module.exports = cfscript
cfscript.displayName = 'cfscript'
cfscript.aliases = []
function cfscript(Prism) {
  // https://cfdocs.org/script
  Prism.languages.cfscript = Prism.languages.extend('clike', {
    comment: [
      {
        pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
        lookbehind: true,
        inside: {
          annotation: {
            pattern: /(?:^|[^.])@[\w\.]+/,
            alias: 'punctuation'
          }
        }
      },
      {
        pattern: /(^|[^\\:])\/\/.*/,
        lookbehind: true,
        greedy: true
      }
    ],
    keyword:
      /\b(?:abstract|break|catch|component|continue|default|do|else|extends|final|finally|for|function|if|in|include|package|private|property|public|remote|required|rethrow|return|static|switch|throw|try|var|while|xml)\b(?!\s*=)/,
    operator: [
      /\+\+|--|&&|\|\||::|=>|[!=]==|<=?|>=?|[-+*/%&|^!=<>]=?|\?(?:\.|:)?|[?:]/,
      /\b(?:and|contains|eq|equal|eqv|gt|gte|imp|is|lt|lte|mod|not|or|xor)\b/
    ],
    scope: {
      pattern:
        /\b(?:application|arguments|cgi|client|cookie|local|session|super|this|variables)\b/,
      alias: 'global'
    },
    type: {
      pattern:
        /\b(?:any|array|binary|boolean|date|guid|numeric|query|string|struct|uuid|void|xml)\b/,
      alias: 'builtin'
    }
  })
  Prism.languages.insertBefore('cfscript', 'keyword', {
    // This must be declared before keyword because we use "function" inside the lookahead
    'function-variable': {
      pattern:
        /[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
      alias: 'function'
    }
  })
  delete Prism.languages.cfscript['class-name']
  Prism.languages.cfc = Prism.languages['cfscript']
}

},{}],"../node_modules/refractor/lang/chaiscript.js":[function(require,module,exports) {
'use strict'
var refractorCpp = require('./cpp.js')
module.exports = chaiscript
chaiscript.displayName = 'chaiscript'
chaiscript.aliases = []
function chaiscript(Prism) {
  Prism.register(refractorCpp)
  Prism.languages.chaiscript = Prism.languages.extend('clike', {
    string: {
      pattern: /(^|[^\\])'(?:[^'\\]|\\[\s\S])*'/,
      lookbehind: true,
      greedy: true
    },
    'class-name': [
      {
        // e.g. class Rectangle { ... }
        pattern: /(\bclass\s+)\w+/,
        lookbehind: true
      },
      {
        // e.g. attr Rectangle::height, def Rectangle::area() { ... }
        pattern: /(\b(?:attr|def)\s+)\w+(?=\s*::)/,
        lookbehind: true
      }
    ],
    keyword:
      /\b(?:attr|auto|break|case|catch|class|continue|def|default|else|finally|for|fun|global|if|return|switch|this|try|var|while)\b/,
    number: [Prism.languages.cpp.number, /\b(?:Infinity|NaN)\b/],
    operator:
      />>=?|<<=?|\|\||&&|:[:=]?|--|\+\+|[=!<>+\-*/%|&^]=?|[?~]|`[^`\r\n]{1,4}`/
  })
  Prism.languages.insertBefore('chaiscript', 'operator', {
    'parameter-type': {
      // e.g. def foo(int x, Vector y) {...}
      pattern: /([,(]\s*)\w+(?=\s+\w)/,
      lookbehind: true,
      alias: 'class-name'
    }
  })
  Prism.languages.insertBefore('chaiscript', 'string', {
    'string-interpolation': {
      pattern:
        /(^|[^\\])"(?:[^"$\\]|\\[\s\S]|\$(?!\{)|\$\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})*"/,
      lookbehind: true,
      greedy: true,
      inside: {
        interpolation: {
          pattern:
            /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/,
          lookbehind: true,
          inside: {
            'interpolation-expression': {
              pattern: /(^\$\{)[\s\S]+(?=\}$)/,
              lookbehind: true,
              inside: Prism.languages.chaiscript
            },
            'interpolation-punctuation': {
              pattern: /^\$\{|\}$/,
              alias: 'punctuation'
            }
          }
        },
        string: /[\s\S]+/
      }
    }
  })
}

},{"./cpp.js":"../node_modules/refractor/lang/cpp.js"}],"../node_modules/refractor/lang/cobol.js":[function(require,module,exports) {
'use strict'

module.exports = cobol
cobol.displayName = 'cobol'
cobol.aliases = []
function cobol(Prism) {
  Prism.languages.cobol = {
    comment: {
      pattern: /\*>.*|(^[ \t]*)\*.*/m,
      lookbehind: true,
      greedy: true
    },
    string: {
      pattern: /[xzgn]?(?:"(?:[^\r\n"]|"")*"(?!")|'(?:[^\r\n']|'')*'(?!'))/i,
      greedy: true
    },
    level: {
      pattern: /(^[ \t]*)\d+\b/m,
      lookbehind: true,
      greedy: true,
      alias: 'number'
    },
    'class-name': {
      // https://github.com/antlr/grammars-v4/blob/42edd5b687d183b5fa679e858a82297bd27141e7/cobol85/Cobol85.g4#L1015
      pattern:
        /(\bpic(?:ture)?\s+)(?:(?:[-\w$/,:*+<>]|\.(?!\s|$))(?:\(\d+\))?)+/i,
      lookbehind: true,
      inside: {
        number: {
          pattern: /(\()\d+/,
          lookbehind: true
        },
        punctuation: /[()]/
      }
    },
    keyword: {
      pattern:
        /(^|[^\w-])(?:ABORT|ACCEPT|ACCESS|ADD|ADDRESS|ADVANCING|AFTER|ALIGNED|ALL|ALPHABET|ALPHABETIC|ALPHABETIC-LOWER|ALPHABETIC-UPPER|ALPHANUMERIC|ALPHANUMERIC-EDITED|ALSO|ALTER|ALTERNATE|ANY|ARE|AREA|AREAS|AS|ASCENDING|ASCII|ASSIGN|ASSOCIATED-DATA|ASSOCIATED-DATA-LENGTH|AT|ATTRIBUTE|AUTHOR|AUTO|AUTO-SKIP|BACKGROUND-COLOR|BACKGROUND-COLOUR|BASIS|BEEP|BEFORE|BEGINNING|BELL|BINARY|BIT|BLANK|BLINK|BLOCK|BOUNDS|BOTTOM|BY|BYFUNCTION|BYTITLE|CALL|CANCEL|CAPABLE|CCSVERSION|CD|CF|CH|CHAINING|CHANGED|CHANNEL|CHARACTER|CHARACTERS|CLASS|CLASS-ID|CLOCK-UNITS|CLOSE|CLOSE-DISPOSITION|COBOL|CODE|CODE-SET|COLLATING|COL|COLUMN|COM-REG|COMMA|COMMITMENT|COMMON|COMMUNICATION|COMP|COMP-1|COMP-2|COMP-3|COMP-4|COMP-5|COMPUTATIONAL|COMPUTATIONAL-1|COMPUTATIONAL-2|COMPUTATIONAL-3|COMPUTATIONAL-4|COMPUTATIONAL-5|COMPUTE|CONFIGURATION|CONTAINS|CONTENT|CONTINUE|CONTROL|CONTROL-POINT|CONTROLS|CONVENTION|CONVERTING|COPY|CORR|CORRESPONDING|COUNT|CRUNCH|CURRENCY|CURSOR|DATA|DATA-BASE|DATE|DATE-COMPILED|DATE-WRITTEN|DAY|DAY-OF-WEEK|DBCS|DE|DEBUG-CONTENTS|DEBUG-ITEM|DEBUG-LINE|DEBUG-NAME|DEBUG-SUB-1|DEBUG-SUB-2|DEBUG-SUB-3|DEBUGGING|DECIMAL-POINT|DECLARATIVES|DEFAULT|DEFAULT-DISPLAY|DEFINITION|DELETE|DELIMITED|DELIMITER|DEPENDING|DESCENDING|DESTINATION|DETAIL|DFHRESP|DFHVALUE|DISABLE|DISK|DISPLAY|DISPLAY-1|DIVIDE|DIVISION|DONTCARE|DOUBLE|DOWN|DUPLICATES|DYNAMIC|EBCDIC|EGCS|EGI|ELSE|EMI|EMPTY-CHECK|ENABLE|END|END-ACCEPT|END-ADD|END-CALL|END-COMPUTE|END-DELETE|END-DIVIDE|END-EVALUATE|END-IF|END-MULTIPLY|END-OF-PAGE|END-PERFORM|END-READ|END-RECEIVE|END-RETURN|END-REWRITE|END-SEARCH|END-START|END-STRING|END-SUBTRACT|END-UNSTRING|END-WRITE|ENDING|ENTER|ENTRY|ENTRY-PROCEDURE|ENVIRONMENT|EOP|ERASE|ERROR|EOL|EOS|ESCAPE|ESI|EVALUATE|EVENT|EVERY|EXCEPTION|EXCLUSIVE|EXHIBIT|EXIT|EXPORT|EXTEND|EXTENDED|EXTERNAL|FD|FILE|FILE-CONTROL|FILLER|FINAL|FIRST|FOOTING|FOR|FOREGROUND-COLOR|FOREGROUND-COLOUR|FROM|FULL|FUNCTION|FUNCTIONNAME|FUNCTION-POINTER|GENERATE|GOBACK|GIVING|GLOBAL|GO|GRID|GROUP|HEADING|HIGHLIGHT|HIGH-VALUE|HIGH-VALUES|I-O|I-O-CONTROL|ID|IDENTIFICATION|IF|IMPLICIT|IMPORT|IN|INDEX|INDEXED|INDICATE|INITIAL|INITIALIZE|INITIATE|INPUT|INPUT-OUTPUT|INSPECT|INSTALLATION|INTEGER|INTO|INVALID|INVOKE|IS|JUST|JUSTIFIED|KANJI|KEPT|KEY|KEYBOARD|LABEL|LANGUAGE|LAST|LB|LD|LEADING|LEFT|LEFTLINE|LENGTH|LENGTH-CHECK|LIBACCESS|LIBPARAMETER|LIBRARY|LIMIT|LIMITS|LINAGE|LINAGE-COUNTER|LINE|LINES|LINE-COUNTER|LINKAGE|LIST|LOCAL|LOCAL-STORAGE|LOCK|LONG-DATE|LONG-TIME|LOWER|LOWLIGHT|LOW-VALUE|LOW-VALUES|MEMORY|MERGE|MESSAGE|MMDDYYYY|MODE|MODULES|MORE-LABELS|MOVE|MULTIPLE|MULTIPLY|NAMED|NATIONAL|NATIONAL-EDITED|NATIVE|NEGATIVE|NETWORK|NEXT|NO|NO-ECHO|NULL|NULLS|NUMBER|NUMERIC|NUMERIC-DATE|NUMERIC-EDITED|NUMERIC-TIME|OBJECT-COMPUTER|OCCURS|ODT|OF|OFF|OMITTED|ON|OPEN|OPTIONAL|ORDER|ORDERLY|ORGANIZATION|OTHER|OUTPUT|OVERFLOW|OVERLINE|OWN|PACKED-DECIMAL|PADDING|PAGE|PAGE-COUNTER|PASSWORD|PERFORM|PF|PH|PIC|PICTURE|PLUS|POINTER|POSITION|POSITIVE|PORT|PRINTER|PRINTING|PRIVATE|PROCEDURE|PROCEDURE-POINTER|PROCEDURES|PROCEED|PROCESS|PROGRAM|PROGRAM-ID|PROGRAM-LIBRARY|PROMPT|PURGE|QUEUE|QUOTE|QUOTES|RANDOM|READER|REMOTE|RD|REAL|READ|RECEIVE|RECEIVED|RECORD|RECORDING|RECORDS|RECURSIVE|REDEFINES|REEL|REF|REFERENCE|REFERENCES|RELATIVE|RELEASE|REMAINDER|REMARKS|REMOVAL|REMOVE|RENAMES|REPLACE|REPLACING|REPORT|REPORTING|REPORTS|REQUIRED|RERUN|RESERVE|REVERSE-VIDEO|RESET|RETURN|RETURN-CODE|RETURNING|REVERSED|REWIND|REWRITE|RF|RH|RIGHT|ROUNDED|RUN|SAME|SAVE|SCREEN|SD|SEARCH|SECTION|SECURE|SECURITY|SEGMENT|SEGMENT-LIMIT|SELECT|SEND|SENTENCE|SEPARATE|SEQUENCE|SEQUENTIAL|SET|SHARED|SHAREDBYALL|SHAREDBYRUNUNIT|SHARING|SHIFT-IN|SHIFT-OUT|SHORT-DATE|SIGN|SIZE|SORT|SORT-CONTROL|SORT-CORE-SIZE|SORT-FILE-SIZE|SORT-MERGE|SORT-MESSAGE|SORT-MODE-SIZE|SORT-RETURN|SOURCE|SOURCE-COMPUTER|SPACE|SPACES|SPECIAL-NAMES|STANDARD|STANDARD-1|STANDARD-2|START|STATUS|STOP|STRING|SUB-QUEUE-1|SUB-QUEUE-2|SUB-QUEUE-3|SUBTRACT|SUM|SUPPRESS|SYMBOL|SYMBOLIC|SYNC|SYNCHRONIZED|TABLE|TALLY|TALLYING|TASK|TAPE|TERMINAL|TERMINATE|TEST|TEXT|THEN|THREAD|THREAD-LOCAL|THROUGH|THRU|TIME|TIMER|TIMES|TITLE|TO|TODAYS-DATE|TODAYS-NAME|TOP|TRAILING|TRUNCATED|TYPE|TYPEDEF|UNDERLINE|UNIT|UNSTRING|UNTIL|UP|UPON|USAGE|USE|USING|VALUE|VALUES|VARYING|VIRTUAL|WAIT|WHEN|WHEN-COMPILED|WITH|WORDS|WORKING-STORAGE|WRITE|YEAR|YYYYMMDD|YYYYDDD|ZERO-FILL|ZEROS|ZEROES)(?![\w-])/i,
      lookbehind: true
    },
    boolean: {
      pattern: /(^|[^\w-])(?:false|true)(?![\w-])/i,
      lookbehind: true
    },
    number: {
      pattern:
        /(^|[^\w-])(?:[+-]?(?:(?:\d+(?:[.,]\d+)?|[.,]\d+)(?:e[+-]?\d+)?|zero))(?![\w-])/i,
      lookbehind: true
    },
    operator: [
      /<>|[<>]=?|[=+*/&]/,
      {
        pattern: /(^|[^\w-])(?:-|and|equal|greater|less|not|or|than)(?![\w-])/i,
        lookbehind: true
      }
    ],
    punctuation: /[.:,()]/
  }
}

},{}],"../node_modules/refractor/lang/coq.js":[function(require,module,exports) {
'use strict'

module.exports = coq
coq.displayName = 'coq'
coq.aliases = []
function coq(Prism) {
  ;(function (Prism) {
    // https://github.com/coq/coq
    var commentSource = /\(\*(?:[^(*]|\((?!\*)|\*(?!\))|<self>)*\*\)/.source
    for (var i = 0; i < 2; i++) {
      commentSource = commentSource.replace(/<self>/g, function () {
        return commentSource
      })
    }
    commentSource = commentSource.replace(/<self>/g, '[]')
    Prism.languages.coq = {
      comment: RegExp(commentSource),
      string: {
        pattern: /"(?:[^"]|"")*"(?!")/,
        greedy: true
      },
      attribute: [
        {
          pattern: RegExp(
            /#\[(?:[^\]("]|"(?:[^"]|"")*"(?!")|\((?!\*)|<comment>)*\]/.source.replace(
              /<comment>/g,
              function () {
                return commentSource
              }
            )
          ),
          greedy: true,
          alias: 'attr-name',
          inside: {
            comment: RegExp(commentSource),
            string: {
              pattern: /"(?:[^"]|"")*"(?!")/,
              greedy: true
            },
            operator: /=/,
            punctuation: /^#\[|\]$|[,()]/
          }
        },
        {
          pattern:
            /\b(?:Cumulative|Global|Local|Monomorphic|NonCumulative|Polymorphic|Private|Program)\b/,
          alias: 'attr-name'
        }
      ],
      keyword:
        /\b(?:_|Abort|About|Add|Admit|Admitted|All|apply|Arguments|as|As|Assumptions|at|Axiom|Axioms|Back|BackTo|Backtrace|Bind|BinOp|BinOpSpec|BinRel|Blacklist|by|Canonical|Case|Cd|Check|Class|Classes|Close|Coercion|Coercions|cofix|CoFixpoint|CoInductive|Collection|Combined|Compute|Conjecture|Conjectures|Constant|Constants|Constraint|Constructors|Context|Corollary|Create|CstOp|Custom|Cut|Debug|Declare|Defined|Definition|Delimit|Dependencies|Dependent|Derive|Diffs|Drop|Elimination|else|end|End|Entry|Equality|Eval|Example|Existential|Existentials|Existing|exists|exists2|Export|Extern|Extraction|Fact|Fail|Field|File|Firstorder|fix|Fixpoint|Flags|Focus|for|forall|From|fun|Funclass|Function|Functional|GC|Generalizable|Goal|Grab|Grammar|Graph|Guarded|Haskell|Heap|Hide|Hint|HintDb|Hints|Hypotheses|Hypothesis|Identity|if|IF|Immediate|Implicit|Implicits|Import|in|Include|Induction|Inductive|Infix|Info|Initial|InjTyp|Inline|Inspect|Instance|Instances|Intro|Intros|Inversion|Inversion_clear|JSON|Language|Left|Lemma|let|Let|Lia|Libraries|Library|Load|LoadPath|Locate|Ltac|Ltac2|match|Match|measure|Method|Minimality|ML|Module|Modules|Morphism|move|Next|NoInline|Notation|Number|Obligation|Obligations|OCaml|Opaque|Open|Optimize|Parameter|Parameters|Parametric|Path|Paths|Prenex|Preterm|Primitive|Print|Profile|Projections|Proof|Prop|PropBinOp|Property|PropOp|Proposition|PropUOp|Pwd|Qed|Quit|Rec|Record|Recursive|Redirect|Reduction|Register|Relation|Remark|Remove|removed|Require|Reserved|Reset|Resolve|Restart|return|Rewrite|Right|Ring|Rings|Saturate|Save|Scheme|Scope|Scopes|Search|SearchHead|SearchPattern|SearchRewrite|Section|Separate|Set|Setoid|Show|Signatures|Solve|Solver|Sort|Sortclass|Sorted|Spec|SProp|Step|Strategies|Strategy|String|struct|Structure|SubClass|Subgraph|SuchThat|Tactic|Term|TestCompile|then|Theorem|Time|Timeout|To|Transparent|Type|Typeclasses|Types|Typing|Undelimit|Undo|Unfocus|Unfocused|Unfold|Universe|Universes|UnOp|UnOpSpec|Unshelve|using|Variable|Variables|Variant|Verbose|View|Visibility|wf|where|with|Zify)\b/,
      number:
        /\b(?:0x[a-f0-9][a-f0-9_]*(?:\.[a-f0-9_]+)?(?:p[+-]?\d[\d_]*)?|\d[\d_]*(?:\.[\d_]+)?(?:e[+-]?\d[\d_]*)?)\b/i,
      punct: {
        pattern: /@\{|\{\||\[=|:>/,
        alias: 'punctuation'
      },
      operator:
        /\/\\|\\\/|\.{2,3}|:{1,2}=|\*\*|[-=]>|<(?:->?|[+:=>]|<:)|>(?:=|->)|\|[-|]?|[-!%&*+/<=>?@^~']/,
      punctuation: /\.\(|`\(|@\{|`\{|\{\||\[=|:>|[:.,;(){}\[\]]/
    }
  })(Prism)
}

},{}],"../node_modules/refractor/lang/cshtml.js":[function(require,module,exports) {
'use strict'
var refractorCsharp = require('./csharp.js')
module.exports = cshtml
cshtml.displayName = 'cshtml'
cshtml.aliases = ['razor']
function cshtml(Prism) {
  Prism.register(refractorCsharp)
  // Docs:
  // https://docs.microsoft.com/en-us/aspnet/core/razor-pages/?view=aspnetcore-5.0&tabs=visual-studio
  // https://docs.microsoft.com/en-us/aspnet/core/mvc/views/razor?view=aspnetcore-5.0
  ;(function (Prism) {
    var commentLike = /\/(?![/*])|\/\/.*[\r\n]|\/\*[^*]*(?:\*(?!\/)[^*]*)*\*\//
      .source
    var stringLike =
      /@(?!")|"(?:[^\r\n\\"]|\\.)*"|@"(?:[^\\"]|""|\\[\s\S])*"(?!")/.source +
      '|' +
      /'(?:(?:[^\r\n'\\]|\\.|\\[Uux][\da-fA-F]{1,8})'|(?=[^\\](?!')))/.source
    /**
     * Creates a nested pattern where all occurrences of the string `<<self>>` are replaced with the pattern itself.
     *
     * @param {string} pattern
     * @param {number} depthLog2
     * @returns {string}
     */
    function nested(pattern, depthLog2) {
      for (var i = 0; i < depthLog2; i++) {
        pattern = pattern.replace(/<self>/g, function () {
          return '(?:' + pattern + ')'
        })
      }
      return pattern
        .replace(/<self>/g, '[^\\s\\S]')
        .replace(/<str>/g, '(?:' + stringLike + ')')
        .replace(/<comment>/g, '(?:' + commentLike + ')')
    }
    var round = nested(/\((?:[^()'"@/]|<str>|<comment>|<self>)*\)/.source, 2)
    var square = nested(/\[(?:[^\[\]'"@/]|<str>|<comment>|<self>)*\]/.source, 2)
    var curly = nested(/\{(?:[^{}'"@/]|<str>|<comment>|<self>)*\}/.source, 2)
    var angle = nested(/<(?:[^<>'"@/]|<str>|<comment>|<self>)*>/.source, 2) // Note about the above bracket patterns:
    // They all ignore HTML expressions that might be in the C# code. This is a problem because HTML (like strings and
    // comments) is parsed differently. This is a huge problem because HTML might contain brackets and quotes which
    // messes up the bracket and string counting implemented by the above patterns.
    //
    // This problem is not fixable because 1) HTML expression are highly context sensitive and very difficult to detect
    // and 2) they require one capturing group at every nested level. See the `tagRegion` pattern to admire the
    // complexity of an HTML expression.
    //
    // To somewhat alleviate the problem a bit, the patterns for characters (e.g. 'a') is very permissive, it also
    // allows invalid characters to support HTML expressions like this: <p>That's it!</p>.
    var tagAttrs =
      /(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?/
        .source
    var tagContent = /(?!\d)[^\s>\/=$<%]+/.source + tagAttrs + /\s*\/?>/.source
    var tagRegion =
      /\B@?/.source +
      '(?:' +
      /<([a-zA-Z][\w:]*)/.source +
      tagAttrs +
      /\s*>/.source +
      '(?:' +
      (/[^<]/.source +
        '|' + // all tags that are not the start tag
        // eslint-disable-next-line regexp/strict
        /<\/?(?!\1\b)/.source +
        tagContent +
        '|' + // nested start tag
        nested(
          // eslint-disable-next-line regexp/strict
          /<\1/.source +
            tagAttrs +
            /\s*>/.source +
            '(?:' +
            (/[^<]/.source +
              '|' + // all tags that are not the start tag
              // eslint-disable-next-line regexp/strict
              /<\/?(?!\1\b)/.source +
              tagContent +
              '|' +
              '<self>') +
            ')*' + // eslint-disable-next-line regexp/strict
            /<\/\1\s*>/.source,
          2
        )) +
      ')*' + // eslint-disable-next-line regexp/strict
      /<\/\1\s*>/.source +
      '|' +
      /</.source +
      tagContent +
      ')' // Now for the actual language definition(s):
    //
    // Razor as a language has 2 parts:
    //  1) CSHTML: A markup-like language that has been extended with inline C# code expressions and blocks.
    //  2) C#+HTML: A variant of C# that can contain CSHTML tags as expressions.
    //
    // In the below code, both CSHTML and C#+HTML will be create as separate language definitions that reference each
    // other. However, only CSHTML will be exported via `Prism.languages`.
    Prism.languages.cshtml = Prism.languages.extend('markup', {})
    var csharpWithHtml = Prism.languages.insertBefore(
      'csharp',
      'string',
      {
        html: {
          pattern: RegExp(tagRegion),
          greedy: true,
          inside: Prism.languages.cshtml
        }
      },
      {
        csharp: Prism.languages.extend('csharp', {})
      }
    )
    var cs = {
      pattern: /\S[\s\S]*/,
      alias: 'language-csharp',
      inside: csharpWithHtml
    }
    Prism.languages.insertBefore('cshtml', 'prolog', {
      'razor-comment': {
        pattern: /@\*[\s\S]*?\*@/,
        greedy: true,
        alias: 'comment'
      },
      block: {
        pattern: RegExp(
          /(^|[^@])@/.source +
            '(?:' +
            [
              // @{ ... }
              curly, // @code{ ... }
              /(?:code|functions)\s*/.source + curly, // @for (...) { ... }
              /(?:for|foreach|lock|switch|using|while)\s*/.source +
                round +
                /\s*/.source +
                curly, // @do { ... } while (...);
              /do\s*/.source +
                curly +
                /\s*while\s*/.source +
                round +
                /(?:\s*;)?/.source, // @try { ... } catch (...) { ... } finally { ... }
              /try\s*/.source +
                curly +
                /\s*catch\s*/.source +
                round +
                /\s*/.source +
                curly +
                /\s*finally\s*/.source +
                curly, // @if (...) {...} else if (...) {...} else {...}
              /if\s*/.source +
                round +
                /\s*/.source +
                curly +
                '(?:' +
                /\s*else/.source +
                '(?:' +
                /\s+if\s*/.source +
                round +
                ')?' +
                /\s*/.source +
                curly +
                ')*'
            ].join('|') +
            ')'
        ),
        lookbehind: true,
        greedy: true,
        inside: {
          keyword: /^@\w*/,
          csharp: cs
        }
      },
      directive: {
        pattern:
          /^([ \t]*)@(?:addTagHelper|attribute|implements|inherits|inject|layout|model|namespace|page|preservewhitespace|removeTagHelper|section|tagHelperPrefix|using)(?=\s).*/m,
        lookbehind: true,
        greedy: true,
        inside: {
          keyword: /^@\w+/,
          csharp: cs
        }
      },
      value: {
        pattern: RegExp(
          /(^|[^@])@/.source +
            /(?:await\b\s*)?/.source +
            '(?:' +
            /\w+\b/.source +
            '|' +
            round +
            ')' +
            '(?:' +
            /[?!]?\.\w+\b/.source +
            '|' +
            round +
            '|' +
            square +
            '|' +
            angle +
            round +
            ')*'
        ),
        lookbehind: true,
        greedy: true,
        alias: 'variable',
        inside: {
          keyword: /^@/,
          csharp: cs
        }
      },
      'delegate-operator': {
        pattern: /(^|[^@])@(?=<)/,
        lookbehind: true,
        alias: 'operator'
      }
    })
    Prism.languages.razor = Prism.languages.cshtml
  })(Prism)
}

},{"./csharp.js":"../node_modules/refractor/lang/csharp.js"}],"../node_modules/refractor/lang/csv.js":[function(require,module,exports) {
'use strict'

module.exports = csv
csv.displayName = 'csv'
csv.aliases = []
function csv(Prism) {
  // https://tools.ietf.org/html/rfc4180
  Prism.languages.csv = {
    value: /[^\r\n,"]+|"(?:[^"]|"")*"(?!")/,
    punctuation: /,/
  }
}

},{}],"../node_modules/refractor/lang/dataweave.js":[function(require,module,exports) {
'use strict'

module.exports = dataweave
dataweave.displayName = 'dataweave'
dataweave.aliases = []
function dataweave(Prism) {
  ;(function (Prism) {
    Prism.languages.dataweave = {
      url: /\b[A-Za-z]+:\/\/[\w/:.?=&-]+|\burn:[\w:.?=&-]+/,
      property: {
        pattern: /(?:\b\w+#)?(?:"(?:\\.|[^\\"\r\n])*"|\b\w+)(?=\s*[:@])/,
        greedy: true
      },
      string: {
        pattern: /(["'`])(?:\\[\s\S]|(?!\1)[^\\])*\1/,
        greedy: true
      },
      'mime-type':
        /\b(?:text|audio|video|application|multipart|image)\/[\w+-]+/,
      date: {
        pattern: /\|[\w:+-]+\|/,
        greedy: true
      },
      comment: [
        {
          pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
          lookbehind: true,
          greedy: true
        },
        {
          pattern: /(^|[^\\:])\/\/.*/,
          lookbehind: true,
          greedy: true
        }
      ],
      regex: {
        pattern: /\/(?:[^\\\/\r\n]|\\[^\r\n])+\//,
        greedy: true
      },
      function: /\b[A-Z_]\w*(?=\s*\()/i,
      number: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
      punctuation: /[{}[\];(),.:@]/,
      operator: /<<|>>|->|[<>~=]=?|!=|--?-?|\+\+?|!|\?/,
      boolean: /\b(?:true|false)\b/,
      keyword:
        /\b(?:match|input|output|ns|type|update|null|if|else|using|unless|at|is|as|case|do|fun|var|not|and|or)\b/
    }
  })(Prism)
}

},{}],"../node_modules/refractor/lang/dot.js":[function(require,module,exports) {
'use strict'

module.exports = dot
dot.displayName = 'dot'
dot.aliases = ['gv']
function dot(Prism) {
  // https://www.graphviz.org/doc/info/lang.html
  ;(function (Prism) {
    var ID =
      '(?:' +
      [
        // an identifier
        /[a-zA-Z_\x80-\uFFFF][\w\x80-\uFFFF]*/.source, // a number
        /-?(?:\.\d+|\d+(?:\.\d*)?)/.source, // a double-quoted string
        /"[^"\\]*(?:\\[\s\S][^"\\]*)*"/.source, // HTML-like string
        /<(?:[^<>]|(?!<!--)<(?:[^<>"']|"[^"]*"|'[^']*')+>|<!--(?:[^-]|-(?!->))*-->)*>/
          .source
      ].join('|') +
      ')'
    var IDInside = {
      markup: {
        pattern: /(^<)[\s\S]+(?=>$)/,
        lookbehind: true,
        alias: ['language-markup', 'language-html', 'language-xml'],
        inside: Prism.languages.markup
      }
    }
    /**
     * @param {string} source
     * @param {string} flags
     * @returns {RegExp}
     */
    function withID(source, flags) {
      return RegExp(
        source.replace(/<ID>/g, function () {
          return ID
        }),
        flags
      )
    }
    Prism.languages.dot = {
      comment: {
        pattern: /\/\/.*|\/\*[\s\S]*?\*\/|^#.*/m,
        greedy: true
      },
      'graph-name': {
        pattern: withID(
          /(\b(?:digraph|graph|subgraph)[ \t\r\n]+)<ID>/.source,
          'i'
        ),
        lookbehind: true,
        greedy: true,
        alias: 'class-name',
        inside: IDInside
      },
      'attr-value': {
        pattern: withID(/(=[ \t\r\n]*)<ID>/.source),
        lookbehind: true,
        greedy: true,
        inside: IDInside
      },
      'attr-name': {
        pattern: withID(/([\[;, \t\r\n])<ID>(?=[ \t\r\n]*=)/.source),
        lookbehind: true,
        greedy: true,
        inside: IDInside
      },
      keyword: /\b(?:digraph|edge|graph|node|strict|subgraph)\b/i,
      'compass-point': {
        pattern: /(:[ \t\r\n]*)(?:[ns][ew]?|[ewc_])(?![\w\x80-\uFFFF])/,
        lookbehind: true,
        alias: 'builtin'
      },
      node: {
        pattern: withID(/(^|[^-.\w\x80-\uFFFF\\])<ID>/.source),
        lookbehind: true,
        greedy: true,
        inside: IDInside
      },
      operator: /[=:]|-[->]/,
      punctuation: /[\[\]{};,]/
    }
    Prism.languages.gv = Prism.languages.dot
  })(Prism)
}

},{}],"../node_modules/refractor/lang/false.js":[function(require,module,exports) {
'use strict'

module.exports = $false
$false.displayName = '$false'
$false.aliases = []
function $false(Prism) {
  ;(function (Prism) {
    /**
     * Based on the manual by Wouter van Oortmerssen.
     *
     * @see {@link https://github.com/PrismJS/prism/issues/2801#issue-829717504}
     */
    Prism.languages['false'] = {
      comment: {
        pattern: /\{[^}]*\}/
      },
      string: {
        pattern: /"[^"]*"/,
        greedy: true
      },
      'character-code': {
        pattern: /'(?:[^\r]|\r\n?)/,
        alias: 'number'
      },
      'assembler-code': {
        pattern: /\d+`/,
        alias: 'important'
      },
      number: /\d+/,
      operator: /[-!#$%&'*+,./:;=>?@\\^_`|~ßø]/,
      punctuation: /\[|\]/,
      variable: /[a-z]/,
      'non-standard': {
        pattern: /[()<BDO®]/,
        alias: 'bold'
      }
    }
  })(Prism)
}

},{}],"../node_modules/refractor/lang/gap.js":[function(require,module,exports) {
'use strict'

module.exports = gap
gap.displayName = 'gap'
gap.aliases = []
function gap(Prism) {
  // https://www.gap-system.org/Manuals/doc/ref/chap4.html
  // https://www.gap-system.org/Manuals/doc/ref/chap27.html
  Prism.languages.gap = {
    shell: {
      pattern: /^gap>[\s\S]*?(?=^gap>|$(?![\s\S]))/m,
      greedy: true,
      inside: {
        gap: {
          pattern: /^(gap>).+(?:(?:\r(?:\n|(?!\n))|\n)>.*)*/,
          lookbehind: true,
          inside: null // see below
        },
        punctuation: /^gap>/
      }
    },
    comment: {
      pattern: /#.*/,
      greedy: true
    },
    string: {
      pattern:
        /(^|[^\\'"])(?:'(?:[^\r\n\\']|\\.){1,10}'|"(?:[^\r\n\\"]|\\.)*"(?!")|"""[\s\S]*?""")/,
      lookbehind: true,
      greedy: true,
      inside: {
        continuation: {
          pattern: /([\r\n])>/,
          lookbehind: true,
          alias: 'punctuation'
        }
      }
    },
    keyword:
      /\b(?:Assert|Info|IsBound|QUIT|TryNextMethod|Unbind|and|atomic|break|continue|do|elif|else|end|fi|for|function|if|in|local|mod|not|od|or|quit|readonly|readwrite|rec|repeat|return|then|until|while)\b/,
    boolean: /\b(?:false|true)\b/,
    function: /\b[a-z_]\w*(?=\s*\()/i,
    number: {
      pattern:
        /(^|[^\w.]|\.\.)(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?(?:_[a-z]?)?(?=$|[^\w.]|\.\.)/,
      lookbehind: true
    },
    continuation: {
      pattern: /([\r\n])>/,
      lookbehind: true,
      alias: 'punctuation'
    },
    operator: /->|[-+*/^~=!]|<>|[<>]=?|:=|\.\./,
    punctuation: /[()[\]{},;.:]/
  }
  Prism.languages.gap.shell.inside.gap.inside = Prism.languages.gap
}

},{}],"../node_modules/refractor/lang/gn.js":[function(require,module,exports) {
'use strict'

module.exports = gn
gn.displayName = 'gn'
gn.aliases = ['gni']
function gn(Prism) {
  // https://gn.googlesource.com/gn/+/refs/heads/main/docs/reference.md#grammar
  Prism.languages.gn = {
    comment: {
      pattern: /#.*/,
      greedy: true
    },
    'string-literal': {
      pattern: /(^|[^\\"])"(?:[^\r\n"\\]|\\.)*"/,
      lookbehind: true,
      greedy: true,
      inside: {
        interpolation: {
          pattern:
            /((?:^|[^\\])(?:\\{2})*)\$(?:\{[\s\S]*?\}|[a-zA-Z_]\w*|0x[a-fA-F0-9]{2})/,
          lookbehind: true,
          inside: {
            number: /^\$0x[\s\S]{2}$/,
            variable: /^\$\w+$/,
            'interpolation-punctuation': {
              pattern: /^\$\{|\}$/,
              alias: 'punctuation'
            },
            expression: {
              pattern: /[\s\S]+/,
              inside: null // see below
            }
          }
        },
        string: /[\s\S]+/
      }
    },
    keyword: /\b(?:else|if)\b/,
    boolean: /\b(?:true|false)\b/,
    'builtin-function': {
      // a few functions get special highlighting to improve readability
      pattern:
        /\b(?:assert|defined|foreach|import|pool|print|template|tool|toolchain)(?=\s*\()/i,
      alias: 'keyword'
    },
    function: /\b[a-z_]\w*(?=\s*\()/i,
    constant:
      /\b(?:current_cpu|current_os|current_toolchain|default_toolchain|host_cpu|host_os|root_build_dir|root_gen_dir|root_out_dir|target_cpu|target_gen_dir|target_out_dir|target_os)\b/,
    number: /-?\b\d+\b/,
    operator: /[-+!=<>]=?|&&|\|\|/,
    punctuation: /[(){}[\],.]/
  }
  Prism.languages.gn['string-literal'].inside['interpolation'].inside[
    'expression'
  ].inside = Prism.languages.gn
  Prism.languages.gni = Prism.languages.gn
}

},{}],"../node_modules/refractor/lang/hoon.js":[function(require,module,exports) {
'use strict'

module.exports = hoon
hoon.displayName = 'hoon'
hoon.aliases = []
function hoon(Prism) {
  Prism.languages.hoon = {
    constant: /%(?:\.[ny]|[\w-]+)/,
    comment: {
      pattern: /::.*/,
      greedy: true
    },
    'class-name': [
      {
        pattern: /@(?:[A-Za-z0-9-]*[A-Za-z0-9])?/
      },
      /\*/
    ],
    function: /(?:\+[-+] {2})?(?:[a-z](?:[a-z0-9-]*[a-z0-9])?)/,
    string: {
      pattern: /"[^"]*"|'[^']*'/,
      greedy: true
    },
    keyword:
      /\.[\^\+\*=\?]|![><:\.=\?!]|=[>|:,\.\-\^<+;/~\*\?]|\?[>|:\.\-\^<\+&~=@!]|\|[\$_%:\.\-\^~\*=@\?]|\+[|\$\+\*]|:[_\-\^\+~\*]|%[_:\.\-\^\+~\*=]|\^[|:\.\-\+&~\*=\?]|\$[|_%:<>\-\^&~@=\?]|;[:<\+;\/~\*=]|~[>|\$_%<\+\/&=\?!]|--|==/
  }
}

},{}],"../node_modules/refractor/lang/icu-message-format.js":[function(require,module,exports) {
'use strict'

module.exports = icuMessageFormat
icuMessageFormat.displayName = 'icuMessageFormat'
icuMessageFormat.aliases = []
function icuMessageFormat(Prism) {
  // https://unicode-org.github.io/icu/userguide/format_parse/messages/
  // https://unicode-org.github.io/icu-docs/apidoc/released/icu4j/com/ibm/icu/text/MessageFormat.html
  ;(function (Prism) {
    /**
     * @param {string} source
     * @param {number} level
     * @returns {string}
     */
    function nested(source, level) {
      if (level <= 0) {
        return /[]/.source
      } else {
        return source.replace(/<SELF>/g, function () {
          return nested(source, level - 1)
        })
      }
    }
    var stringPattern = /'[{}:=,](?:[^']|'')*'(?!')/
    var escape = {
      pattern: /''/,
      greedy: true,
      alias: 'operator'
    }
    var string = {
      pattern: stringPattern,
      greedy: true,
      inside: {
        escape: escape
      }
    }
    var argumentSource = nested(
      /\{(?:[^{}']|'(?![{},'])|''|<STR>|<SELF>)*\}/.source.replace(
        /<STR>/g,
        function () {
          return stringPattern.source
        }
      ),
      8
    )
    var nestedMessage = {
      pattern: RegExp(argumentSource),
      inside: {
        message: {
          pattern: /^(\{)[\s\S]+(?=\}$)/,
          lookbehind: true,
          inside: null // see below
        },
        'message-delimiter': {
          pattern: /./,
          alias: 'punctuation'
        }
      }
    }
    Prism.languages['icu-message-format'] = {
      argument: {
        pattern: RegExp(argumentSource),
        greedy: true,
        inside: {
          content: {
            pattern: /^(\{)[\s\S]+(?=\}$)/,
            lookbehind: true,
            inside: {
              'argument-name': {
                pattern: /^(\s*)[^{}:=,\s]+/,
                lookbehind: true
              },
              'choice-style': {
                // https://unicode-org.github.io/icu-docs/apidoc/released/icu4c/classicu_1_1ChoiceFormat.html#details
                pattern: /^(\s*,\s*choice\s*,\s*)\S(?:[\s\S]*\S)?/,
                lookbehind: true,
                inside: {
                  punctuation: /\|/,
                  range: {
                    pattern: /^(\s*)[+-]?(?:\d+(?:\.\d*)?|\u221e)\s*[<#\u2264]/,
                    lookbehind: true,
                    inside: {
                      operator: /[<#\u2264]/,
                      number: /\S+/
                    }
                  },
                  rest: null // see below
                }
              },
              'plural-style': {
                // https://unicode-org.github.io/icu-docs/apidoc/released/icu4j/com/ibm/icu/text/PluralFormat.html#:~:text=Patterns%20and%20Their%20Interpretation
                pattern:
                  /^(\s*,\s*(?:plural|selectordinal)\s*,\s*)\S(?:[\s\S]*\S)?/,
                lookbehind: true,
                inside: {
                  offset: /^offset:\s*\d+/,
                  'nested-message': nestedMessage,
                  selector: {
                    pattern: /=\d+|[^{}:=,\s]+/,
                    inside: {
                      keyword: /^(?:zero|one|two|few|many|other)$/
                    }
                  }
                }
              },
              'select-style': {
                // https://unicode-org.github.io/icu-docs/apidoc/released/icu4j/com/ibm/icu/text/SelectFormat.html#:~:text=Patterns%20and%20Their%20Interpretation
                pattern: /^(\s*,\s*select\s*,\s*)\S(?:[\s\S]*\S)?/,
                lookbehind: true,
                inside: {
                  'nested-message': nestedMessage,
                  selector: {
                    pattern: /[^{}:=,\s]+/,
                    inside: {
                      keyword: /^other$/
                    }
                  }
                }
              },
              keyword: /\b(?:choice|plural|select|selectordinal)\b/,
              'arg-type': {
                pattern: /\b(?:number|date|time|spellout|ordinal|duration)\b/,
                alias: 'keyword'
              },
              'arg-skeleton': {
                pattern: /(,\s*)::[^{}:=,\s]+/,
                lookbehind: true
              },
              'arg-style': {
                pattern:
                  /(,\s*)(?:short|medium|long|full|integer|currency|percent)(?=\s*$)/,
                lookbehind: true
              },
              'arg-style-text': {
                pattern: RegExp(
                  /(^\s*,\s*(?=\S))/.source +
                    nested(/(?:[^{}']|'[^']*'|\{(?:<SELF>)?\})+/.source, 8) +
                    '$'
                ),
                lookbehind: true,
                alias: 'string'
              },
              punctuation: /,/
            }
          },
          'argument-delimiter': {
            pattern: /./,
            alias: 'operator'
          }
        }
      },
      escape: escape,
      string: string
    }
    nestedMessage.inside.message.inside = Prism.languages['icu-message-format']
    Prism.languages['icu-message-format'].argument.inside.content.inside[
      'choice-style'
    ].inside.rest = Prism.languages['icu-message-format']
  })(Prism)
}

},{}],"../node_modules/refractor/lang/idris.js":[function(require,module,exports) {
'use strict'
var refractorHaskell = require('./haskell.js')
module.exports = idris
idris.displayName = 'idris'
idris.aliases = ['idr']
function idris(Prism) {
  Prism.register(refractorHaskell)
  Prism.languages.idris = Prism.languages.extend('haskell', {
    comment: {
      pattern: /(?:(?:--|\|\|\|).*$|\{-[\s\S]*?-\})/m
    },
    keyword:
      /\b(?:Type|case|class|codata|constructor|corecord|data|do|dsl|else|export|if|implementation|implicit|import|impossible|in|infix|infixl|infixr|instance|interface|let|module|mutual|namespace|of|parameters|partial|postulate|private|proof|public|quoteGoal|record|rewrite|syntax|then|total|using|where|with)\b/,
    'import-statement': {
      pattern: /(^\s*)import\s+(?:[A-Z][\w']*)(?:\.[A-Z][\w']*)*/m,
      lookbehind: true
    },
    builtin: undefined
  })
  Prism.languages.idr = Prism.languages.idris
}

},{"./haskell.js":"../node_modules/refractor/lang/haskell.js"}],"../node_modules/refractor/lang/jexl.js":[function(require,module,exports) {
'use strict'

module.exports = jexl
jexl.displayName = 'jexl'
jexl.aliases = []
function jexl(Prism) {
  Prism.languages.jexl = {
    string: /(["'])(?:\\[\s\S]|(?!\1)[^\\])*\1/,
    transform: {
      pattern:
        /(\|\s*)[a-zA-Zа-яА-Я_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF$][\wа-яА-Я\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF$]*/,
      alias: 'function',
      lookbehind: true
    },
    function:
      /[a-zA-Zа-яА-Я_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF$][\wа-яА-Я\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF$]*\s*(?=\()/,
    number: /\b\d+(?:\.\d+)?\b|\B\.\d+\b/,
    operator: /[<>!]=?|-|\+|&&|==|\|\|?|\/\/?|[?:*^%]/,
    boolean: /\b(?:true|false)\b/,
    keyword: /\bin\b/,
    punctuation: /[{}[\](),.]/
  }
}

},{}],"../node_modules/refractor/lang/kumir.js":[function(require,module,exports) {
'use strict'

module.exports = kumir
kumir.displayName = 'kumir'
kumir.aliases = ['kum']
function kumir(Prism) {
  /* eslint-disable regexp/no-dupe-characters-character-class */
  ;(function (Prism) {
    /**
     * Regular expression for characters that are not allowed in identifiers.
     *
     * @type {string}
     */
    var nonId = /\s\x00-\x1f\x22-\x2f\x3a-\x3f\x5b-\x5e\x60\x7b-\x7e/.source
    /**
     * Surround a regular expression for IDs with patterns for non-ID sequences.
     *
     * @param {string} pattern A regular expression for identifiers.
     * @param {string} [flags] The regular expression flags.
     * @returns {RegExp} A wrapped regular expression for identifiers.
     */
    function wrapId(pattern, flags) {
      return RegExp(pattern.replace(/<nonId>/g, nonId), flags)
    }
    Prism.languages.kumir = {
      comment: {
        pattern: /\|.*/
      },
      prolog: {
        pattern: /#.*/,
        greedy: true
      },
      string: {
        pattern: /"[^\n\r"]*"|'[^\n\r']*'/,
        greedy: true
      },
      boolean: {
        pattern: wrapId(/(^|[<nonId>])(?:да|нет)(?=[<nonId>]|$)/.source),
        lookbehind: true
      },
      'operator-word': {
        pattern: wrapId(/(^|[<nonId>])(?:и|или|не)(?=[<nonId>]|$)/.source),
        lookbehind: true,
        alias: 'keyword'
      },
      'system-variable': {
        pattern: wrapId(/(^|[<nonId>])знач(?=[<nonId>]|$)/.source),
        lookbehind: true,
        alias: 'keyword'
      },
      type: [
        {
          pattern: wrapId(
            /(^|[<nonId>])(?:вещ|лит|лог|сим|цел)(?:\x20*таб)?(?=[<nonId>]|$)/
              .source
          ),
          lookbehind: true,
          alias: 'builtin'
        },
        {
          pattern: wrapId(
            /(^|[<nonId>])(?:компл|сканкод|файл|цвет)(?=[<nonId>]|$)/.source
          ),
          lookbehind: true,
          alias: 'important'
        }
      ],
      /**
       * Should be performed after searching for type names because of "таб".
       * "таб" is a reserved word, but never used without a preceding type name.
       * "НАЗНАЧИТЬ", "Фввод", and "Фвывод" are not reserved words.
       */
      keyword: {
        pattern: wrapId(
          /(^|[<nonId>])(?:алг|арг(?:\x20*рез)?|ввод|ВКЛЮЧИТЬ|вс[её]|выбор|вывод|выход|дано|для|до|дс|если|иначе|исп|использовать|кон(?:(?:\x20+|_)исп)?|кц(?:(?:\x20+|_)при)?|надо|нач|нс|нц|от|пауза|пока|при|раза?|рез|стоп|таб|то|утв|шаг)(?=[<nonId>]|$)/
            .source
        ),
        lookbehind: true
      },
      /** Should be performed after searching for reserved words. */
      name: {
        // eslint-disable-next-line regexp/no-super-linear-backtracking
        pattern: wrapId(
          /(^|[<nonId>])[^\d<nonId>][^<nonId>]*(?:\x20+[^<nonId>]+)*(?=[<nonId>]|$)/
            .source
        ),
        lookbehind: true
      },
      /** Should be performed after searching for names. */
      number: {
        pattern: wrapId(
          /(^|[<nonId>])(?:\B\$[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?)(?=[<nonId>]|$)/
            .source,
          'i'
        ),
        lookbehind: true
      },
      /** Should be performed after searching for words. */
      punctuation: /:=|[(),:;\[\]]/,
      /**
       * Should be performed after searching for
       * - numeric constants (because of "+" and "-");
       * - punctuation marks (because of ":=" and "=").
       */
      'operator-char': {
        pattern: /\*\*?|<[=>]?|>=?|[-+/=]/,
        alias: 'operator'
      }
    }
    Prism.languages.kum = Prism.languages.kumir
  })(Prism)
}

},{}],"../node_modules/refractor/lang/kusto.js":[function(require,module,exports) {
'use strict'

module.exports = kusto
kusto.displayName = 'kusto'
kusto.aliases = []
function kusto(Prism) {
  Prism.languages.kusto = {
    comment: {
      pattern: /\/\/.*/,
      greedy: true
    },
    string: {
      pattern:
        /```[\s\S]*?```|[hH]?(?:"(?:[^\r\n\\"]|\\.)*"|'(?:[^\r\n\\']|\\.)*'|@(?:"[^\r\n"]*"|'[^\r\n']*'))/,
      greedy: true
    },
    verb: {
      pattern: /(\|\s*)[a-z][\w-]*/i,
      lookbehind: true,
      alias: 'keyword'
    },
    command: {
      pattern: /\.[a-z][a-z\d-]*\b/,
      alias: 'keyword'
    },
    'class-name':
      /\b(?:bool|datetime|decimal|dynamic|guid|int|long|real|string|timespan)\b/,
    keyword:
      /\b(?:access|alias|and|anti|as|asc|auto|between|by|database|declare|desc|external|from|fullouter|has_all|in|ingestion|inline|inner|innerunique|into|let|like|local|not|of|on|or|pattern|print|query_parameters|range|restrict|schema|set|step|table|tables|to|view|where|with|(?:has(?:perfix|suffix)?|contains|(?:starts|ends)with)(?:_cs)?|(?:left|right)(?:anti(?:semi)?|inner|outer|semi)?|matches\s+regex|nulls\s+(?:first|last))(?![\w-])/,
    boolean: /\b(?:true|false|null)\b/,
    function: /\b[a-z_]\w*(?=\s*\()/,
    datetime: [
      {
        // RFC 822 + RFC 850
        pattern:
          /\b(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*,\s*)?\d{1,2}(?:\s+|-)(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:\s+|-)\d{2}\s+\d{2}:\d{2}(?::\d{2})?(?:\s*(?:\b(?:(?:U|GM|[ECMT][DS])T|[A-Z])|[+-]\d{4}))?\b/,
        alias: 'number'
      },
      {
        // ISO 8601
        pattern:
          /[+-]?\b(?:\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?|\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)Z?/,
        alias: 'number'
      }
    ],
    number:
      /\b(?:0x[0-9A-Fa-f]+|\d+(?:\.\d+)?(?:[Ee][+-]?\d+)?)(?:(?:min|sec|[mnµ]s|tick|microsecond|[dhms])\b)?|[+-]?\binf\b/,
    operator: /=>|[!=]~|[!=<>]=?|[-+*/%|]|\.\./,
    punctuation: /[()\[\]{},;.:]/
  }
}

},{}],"../node_modules/refractor/lang/log.js":[function(require,module,exports) {
'use strict'

module.exports = log
log.displayName = 'log'
log.aliases = []
function log(Prism) {
  // This is a language definition for generic log files.
  // Since there is no one log format, this language definition has to support all formats to some degree.
  //
  // Based on https://github.com/MTDL9/vim-log-highlighting
  Prism.languages.log = {
    string: {
      // Single-quoted strings must not be confused with plain text. E.g. Can't isn't Susan's Chris' toy
      pattern: /"(?:[^"\\\r\n]|\\.)*"|'(?![st] | \w)(?:[^'\\\r\n]|\\.)*'/,
      greedy: true
    },
    exception: {
      pattern:
        /(^|[^\w.])[a-z][\w.]*(?:Exception|Error):.*(?:(?:\r\n?|\n)[ \t]*(?:at[ \t].+|\.{3}.*|Caused by:.*))+(?:(?:\r\n?|\n)[ \t]*\.\.\. .*)?/,
      lookbehind: true,
      greedy: true,
      alias: ['javastacktrace', 'language-javastacktrace'],
      inside: Prism.languages['javastacktrace'] || {
        keyword: /\bat\b/,
        function: /[a-z_][\w$]*(?=\()/,
        punctuation: /[.:()]/
      }
    },
    level: [
      {
        pattern:
          /\b(?:ALERT|CRIT|CRITICAL|EMERG|EMERGENCY|ERR|ERROR|FAILURE|FATAL|SEVERE)\b/,
        alias: ['error', 'important']
      },
      {
        pattern: /\b(?:WARN|WARNING|WRN)\b/,
        alias: ['warning', 'important']
      },
      {
        pattern: /\b(?:DISPLAY|INF|INFO|NOTICE|STATUS)\b/,
        alias: ['info', 'keyword']
      },
      {
        pattern: /\b(?:DBG|DEBUG|FINE)\b/,
        alias: ['debug', 'keyword']
      },
      {
        pattern: /\b(?:FINER|FINEST|TRACE|TRC|VERBOSE|VRB)\b/,
        alias: ['trace', 'comment']
      }
    ],
    property: {
      pattern:
        /((?:^|[\]|])[ \t]*)[a-z_](?:[\w-]|\b\/\b)*(?:[. ]\(?\w(?:[\w-]|\b\/\b)*\)?)*:(?=\s)/im,
      lookbehind: true
    },
    separator: {
      pattern: /(^|[^-+])-{3,}|={3,}|\*{3,}|- - /m,
      lookbehind: true,
      alias: 'comment'
    },
    url: /\b(?:https?|ftp|file):\/\/[^\s|,;'"]*[^\s|,;'">.]/,
    email: {
      pattern: /(^|\s)[-\w+.]+@[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+(?=\s)/,
      lookbehind: true,
      alias: 'url'
    },
    'ip-address': {
      pattern: /\b(?:\d{1,3}(?:\.\d{1,3}){3})\b/i,
      alias: 'constant'
    },
    'mac-address': {
      pattern: /\b[a-f0-9]{2}(?::[a-f0-9]{2}){5}\b/i,
      alias: 'constant'
    },
    domain: {
      pattern:
        /(^|\s)[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*\.[a-z][a-z0-9-]+(?=\s)/,
      lookbehind: true,
      alias: 'constant'
    },
    uuid: {
      pattern:
        /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
      alias: 'constant'
    },
    hash: {
      pattern: /\b(?:[a-f0-9]{32}){1,2}\b/i,
      alias: 'constant'
    },
    'file-path': {
      pattern:
        /\b[a-z]:[\\/][^\s|,;:(){}\[\]"']+|(^|[\s:\[\](>|])\.{0,2}\/\w[^\s|,;:(){}\[\]"']*/i,
      lookbehind: true,
      greedy: true,
      alias: 'string'
    },
    date: {
      pattern: RegExp(
        /\b\d{4}[-/]\d{2}[-/]\d{2}(?:T(?=\d{1,2}:)|(?=\s\d{1,2}:))/.source +
          '|' +
          /\b\d{1,4}[-/ ](?:\d{1,2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-/ ]\d{2,4}T?\b/
            .source +
          '|' +
          /\b(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:\s{1,2}(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))?|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s{1,2}\d{1,2}\b/
            .source,
        'i'
      ),
      alias: 'number'
    },
    time: {
      pattern:
        /\b\d{1,2}:\d{1,2}:\d{1,2}(?:[.,:]\d+)?(?:\s?[+-]\d{2}:?\d{2}|Z)?\b/,
      alias: 'number'
    },
    boolean: /\b(?:true|false|null)\b/i,
    number: {
      pattern:
        /(^|[^.\w])(?:0x[a-f0-9]+|0o[0-7]+|0b[01]+|v?\d[\da-f]*(?:\.\d+)*(?:e[+-]?\d+)?[a-z]{0,3}\b)\b(?!\.\w)/i,
      lookbehind: true
    },
    operator: /[;:?<=>~/@!$%&+\-|^(){}*#]/,
    punctuation: /[\[\].,]/
  }
}

},{}],"../node_modules/refractor/lang/magma.js":[function(require,module,exports) {
'use strict'

module.exports = magma
magma.displayName = 'magma'
magma.aliases = []
function magma(Prism) {
  Prism.languages.magma = {
    output: {
      pattern:
        /^(>.*(?:\r(?:\n|(?!\n))|\n))(?!>)(?:.+|(?:\r(?:\n|(?!\n))|\n)(?!>).*)(?:(?:\r(?:\n|(?!\n))|\n)(?!>).*)*/m,
      lookbehind: true,
      greedy: true
    },
    comment: {
      pattern: /\/\/.*|\/\*[\s\S]*?\*\//,
      greedy: true
    },
    string: {
      pattern: /(^|[^\\"])"(?:[^\r\n\\"]|\\.)*"/,
      lookbehind: true,
      greedy: true
    },
    // http://magma.maths.usyd.edu.au/magma/handbook/text/82
    keyword:
      /\b(?:_|adj|and|assert|assert2|assert3|assigned|break|by|case|cat|catch|clear|cmpeq|cmpne|continue|declare|default|delete|diff|div|do|elif|else|end|eq|error|eval|exists|exit|for|forall|forward|fprintf|freeze|function|ge|gt|if|iload|import|in|intrinsic|is|join|le|load|local|lt|meet|mod|ne|not|notadj|notin|notsubset|or|print|printf|procedure|quit|random|read|readi|repeat|require|requirege|requirerange|restore|return|save|sdiff|select|subset|then|time|to|try|until|vprint|vprintf|vtime|when|where|while|xor)\b/,
    boolean: /\b(?:false|true)\b/,
    generator: {
      pattern: /\b[a-z_]\w*(?=\s*<)/i,
      alias: 'class-name'
    },
    function: /\b[a-z_]\w*(?=\s*\()/i,
    number: {
      pattern:
        /(^|[^\w.]|\.\.)(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?(?:_[a-z]?)?(?=$|[^\w.]|\.\.)/,
      lookbehind: true
    },
    operator: /->|[-+*/^~!|#=]|:=|\.\./,
    punctuation: /[()[\]{}<>,;.:]/
  }
}

},{}],"../node_modules/refractor/lang/maxscript.js":[function(require,module,exports) {
'use strict'

module.exports = maxscript
maxscript.displayName = 'maxscript'
maxscript.aliases = []
function maxscript(Prism) {
  Prism.languages.maxscript = {
    comment: {
      pattern: /\/\*[\s\S]*?(?:\*\/|$)|--.*/,
      greedy: true
    },
    string: {
      pattern: /(^|[^"\\@])(?:"(?:[^"\\]|\\[\s\S])*"|@"[^"]*")/,
      lookbehind: true,
      greedy: true
    },
    path: {
      pattern: /\$(?:[\w/\\.*?]|'[^']*')*/,
      greedy: true,
      alias: 'string'
    },
    'function-definition': {
      pattern: /(\b(?:function|fn)\s+)\w+\b/,
      lookbehind: true,
      alias: 'function'
    },
    argument: {
      pattern: /\b[a-z_]\w*(?=:)/i,
      alias: 'attr-name'
    },
    keyword:
      /\b(?:about|and|animate|as|at|attributes|by|case|catch|collect|continue|coordsys|do|else|exit|fn|for|from|function|global|if|in|local|macroscript|mapped|max|not|of|off|on|or|parameters|persistent|plugin|rcmenu|return|rollout|set|struct|then|throw|to|tool|try|undo|utility|when|where|while|with)\b/i,
    boolean: /\b(?:true|false|on|off)\b/,
    time: {
      pattern:
        /(^|[^\w.])(?:(?:(?:\d+(?:\.\d*)?|\.\d+)(?:[eEdD][+-]\d+|[LP])?[msft])+|\d+:\d+(?:\.\d*)?)(?![\w.:])/,
      lookbehind: true,
      alias: 'number'
    },
    number: [
      {
        pattern:
          /(^|[^\w.])(?:(?:\d+(?:\.\d*)?|\.\d+)(?:[eEdD][+-]\d+|[LP])?|0x[a-fA-F0-9]+)(?![\w.:])/,
        lookbehind: true
      },
      /\b(?:e|pi)\b/
    ],
    constant: /\b(?:black|blue|brown|gray|green|orange|red|white|yellow)\b/,
    color: {
      pattern: /\b(?:dontcollect|ok|silentValue|undefined|unsupplied)\b/i,
      alias: 'constant'
    },
    operator: /[-+*/<>=!]=?|[&^]|#(?!\()/,
    punctuation: /[()\[\]{}.:,;]|#(?=\()|\\$/m
  }
}

},{}],"../node_modules/refractor/lang/mermaid.js":[function(require,module,exports) {
'use strict'

module.exports = mermaid
mermaid.displayName = 'mermaid'
mermaid.aliases = []
function mermaid(Prism) {
  Prism.languages.mermaid = {
    comment: {
      pattern: /%%.*/,
      greedy: true
    },
    style: {
      pattern:
        /^([ \t]*(?:classDef|linkStyle|style)[ \t]+[\w$-]+[ \t]+)\w.*[^\s;]/m,
      lookbehind: true,
      inside: {
        property: /\b\w[\w-]*(?=[ \t]*:)/,
        operator: /:/,
        punctuation: /,/
      }
    },
    'inter-arrow-label': {
      pattern:
        /([^<>ox.=-])(?:-[-.]|==)(?![<>ox.=-])[ \t]*(?:"[^"\r\n]*"|[^\s".=-](?:[^\r\n.=-]*[^\s.=-])?)[ \t]*(?:\.+->?|--+[->]|==+[=>])(?![<>ox.=-])/,
      lookbehind: true,
      greedy: true,
      inside: {
        arrow: {
          pattern: /(?:\.+->?|--+[->]|==+[=>])$/,
          alias: 'operator'
        },
        label: {
          pattern: /^([\s\S]{2}[ \t]*)\S(?:[\s\S]*\S)?/,
          lookbehind: true,
          alias: 'property'
        },
        'arrow-head': {
          pattern: /^\S+/,
          alias: ['arrow', 'operator']
        }
      }
    },
    arrow: [
      // This might look complex but it really isn't.
      // There are many possible arrows (see tests) and it's impossible to fit all of them into one pattern. The
      // problem is that we only have one lookbehind per pattern. However, we cannot disallow too many arrow
      // characters in the one lookbehind because that would create too many false negatives. So we have to split the
      // arrows into different patterns.
      {
        // ER diagram
        pattern: /(^|[^{}|o.-])[|}][|o](?:--|\.\.)[|o][|{](?![{}|o.-])/,
        lookbehind: true,
        alias: 'operator'
      },
      {
        // flow chart
        // (?:==+|--+|-\.*-)
        pattern:
          /(^|[^<>ox.=-])(?:[<ox](?:==+|--+|-\.*-)[>ox]?|(?:==+|--+|-\.*-)[>ox]|===+|---+|-\.+-)(?![<>ox.=-])/,
        lookbehind: true,
        alias: 'operator'
      },
      {
        // sequence diagram
        pattern:
          /(^|[^<>()x-])(?:--?(?:>>|[x>)])(?![<>()x])|(?:<<|[x<(])--?(?!-))/,
        lookbehind: true,
        alias: 'operator'
      },
      {
        // class diagram
        pattern:
          /(^|[^<>|*o.-])(?:[*o]--|--[*o]|<\|?(?:--|\.\.)|(?:--|\.\.)\|?>|--|\.\.)(?![<>|*o.-])/,
        lookbehind: true,
        alias: 'operator'
      }
    ],
    label: {
      pattern: /(^|[^|<])\|(?:[^\r\n"|]|"[^"\r\n]*")+\|/,
      lookbehind: true,
      greedy: true,
      alias: 'property'
    },
    text: {
      pattern: /(?:[(\[{]+|\b>)(?:[^\r\n"()\[\]{}]|"[^"\r\n]*")+(?:[)\]}]+|>)/,
      alias: 'string'
    },
    string: {
      pattern: /"[^"\r\n]*"/,
      greedy: true
    },
    annotation: {
      pattern:
        /<<(?:abstract|choice|enumeration|fork|interface|join|service)>>|\[\[(?:choice|fork|join)\]\]/i,
      alias: 'important'
    },
    keyword: [
      // This language has both case-sensitive and case-insensitive keywords
      {
        pattern:
          /(^[ \t]*)(?:action|callback|class|classDef|classDiagram|click|direction|erDiagram|flowchart|gantt|gitGraph|graph|journey|link|linkStyle|pie|requirementDiagram|sequenceDiagram|stateDiagram|stateDiagram-v2|style|subgraph)(?![\w$-])/m,
        lookbehind: true,
        greedy: true
      },
      {
        pattern:
          /(^[ \t]*)(?:activate|alt|and|as|autonumber|deactivate|else|end(?:[ \t]+note)?|loop|opt|par|participant|rect|state|note[ \t]+(?:over|(?:left|right)[ \t]+of))(?![\w$-])/im,
        lookbehind: true,
        greedy: true
      }
    ],
    entity: /#[a-z0-9]+;/,
    operator: {
      pattern: /(\w[ \t]*)&(?=[ \t]*\w)|:::|:/,
      lookbehind: true
    },
    punctuation: /[(){};]/
  }
}

},{}],"../node_modules/refractor/lang/nevod.js":[function(require,module,exports) {
'use strict'

module.exports = nevod
nevod.displayName = 'nevod'
nevod.aliases = []
function nevod(Prism) {
  Prism.languages.nevod = {
    comment: /\/\/.*|(?:\/\*[\s\S]*?(?:\*\/|$))/,
    string: {
      pattern: /(?:"(?:""|[^"])*"(?!")|'(?:''|[^'])*'(?!'))!?\*?/,
      greedy: true,
      inside: {
        'string-attrs': /!$|!\*$|\*$/
      }
    },
    namespace: {
      pattern: /(@namespace\s+)[a-zA-Z0-9\-.]+(?=\s*\{)/,
      lookbehind: true
    },
    pattern: {
      pattern:
        /(@pattern\s+)?#?[a-zA-Z0-9\-.]+(?:\s*\(\s*(?:~\s*)?[a-zA-Z0-9\-.]+\s*(?:,\s*(?:~\s*)?[a-zA-Z0-9\-.]*)*\))?(?=\s*=)/,
      lookbehind: true,
      inside: {
        'pattern-name': {
          pattern: /^#?[a-zA-Z0-9\-.]+/,
          alias: 'class-name'
        },
        fields: {
          pattern: /\(.*\)/,
          inside: {
            'field-name': {
              pattern: /[a-zA-Z0-9\-.]+/,
              alias: 'variable'
            },
            punctuation: /[,()]/,
            operator: {
              pattern: /~/,
              alias: 'field-hidden-mark'
            }
          }
        }
      }
    },
    search: {
      pattern: /(@search\s+|#)[a-zA-Z0-9\-.]+(?:\.\*)?(?=\s*;)/,
      alias: 'function',
      lookbehind: true
    },
    keyword:
      /@(?:require|namespace|pattern|search|inside|outside|having|where)\b/,
    'standard-pattern': {
      pattern:
        /\b(?:Word|Punct|Symbol|Space|LineBreak|Start|End|Alpha|AlphaNum|Num|NumAlpha|Blank|WordBreak|Any)(?:\([a-zA-Z0-9\-.,\s+]*\))?/,
      inside: {
        'standard-pattern-name': {
          pattern: /^[a-zA-Z0-9\-.]+/,
          alias: 'builtin'
        },
        quantifier: {
          pattern: /\b\d+(?:\s*\+|\s*-\s*\d+)?(?!\w)/,
          alias: 'number'
        },
        'standard-pattern-attr': {
          pattern: /[a-zA-Z0-9\-.]+/,
          alias: 'builtin'
        },
        punctuation: /[,()]/
      }
    },
    quantifier: {
      pattern: /\b\d+(?:\s*\+|\s*-\s*\d+)?(?!\w)/,
      alias: 'number'
    },
    operator: [
      {
        pattern: /=/,
        alias: 'pattern-def'
      },
      {
        pattern: /&/,
        alias: 'conjunction'
      },
      {
        pattern: /~/,
        alias: 'exception'
      },
      {
        pattern: /\?/,
        alias: 'optionality'
      },
      {
        pattern: /[[\]]/,
        alias: 'repetition'
      },
      {
        pattern: /[{}]/,
        alias: 'variation'
      },
      {
        pattern: /[+_]/,
        alias: 'sequence'
      },
      {
        pattern: /\.{2,3}/,
        alias: 'span'
      }
    ],
    'field-capture': [
      {
        pattern:
          /([a-zA-Z0-9\-.]+\s*\()\s*[a-zA-Z0-9\-.]+\s*:\s*[a-zA-Z0-9\-.]+(?:\s*,\s*[a-zA-Z0-9\-.]+\s*:\s*[a-zA-Z0-9\-.]+)*(?=\s*\))/,
        lookbehind: true,
        inside: {
          'field-name': {
            pattern: /[a-zA-Z0-9\-.]+/,
            alias: 'variable'
          },
          colon: /:/
        }
      },
      {
        pattern: /[a-zA-Z0-9\-.]+\s*:/,
        inside: {
          'field-name': {
            pattern: /[a-zA-Z0-9\-.]+/,
            alias: 'variable'
          },
          colon: /:/
        }
      }
    ],
    punctuation: /[:;,()]/,
    name: /[a-zA-Z0-9\-.]+/
  }
}

},{}],"../node_modules/refractor/lang/openqasm.js":[function(require,module,exports) {
'use strict'

module.exports = openqasm
openqasm.displayName = 'openqasm'
openqasm.aliases = ['qasm']
function openqasm(Prism) {
  // https://qiskit.github.io/openqasm/grammar/index.html
  Prism.languages.openqasm = {
    comment: /\/\*[\s\S]*?\*\/|\/\/.*/,
    string: {
      pattern: /"[^"\r\n\t]*"|'[^'\r\n\t]*'/,
      greedy: true
    },
    keyword:
      /\b(?:barrier|boxas|boxto|break|const|continue|ctrl|def|defcal|defcalgrammar|delay|else|end|for|gate|gphase|if|in|include|inv|kernel|lengthof|let|measure|pow|reset|return|rotary|stretchinf|while|CX|OPENQASM|U)\b|#pragma\b/,
    'class-name':
      /\b(?:angle|bit|bool|creg|fixed|float|int|length|qreg|qubit|stretch|uint)\b/,
    function: /\b(?:sin|cos|tan|exp|ln|sqrt|rotl|rotr|popcount)\b(?=\s*\()/,
    constant: /\b(?:pi|tau|euler)\b|π|𝜏|ℇ/,
    number: {
      pattern:
        /(^|[^.\w$])(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?(?:dt|ns|us|µs|ms|s)?/i,
      lookbehind: true
    },
    operator: /->|>>=?|<<=?|&&|\|\||\+\+|--|[!=<>&|~^+\-*/%]=?|@/,
    punctuation: /[(){}\[\];,:.]/
  }
  Prism.languages.qasm = Prism.languages.openqasm
}

},{}],"../node_modules/refractor/lang/promql.js":[function(require,module,exports) {
'use strict'

module.exports = promql
promql.displayName = 'promql'
promql.aliases = []
function promql(Prism) {
  // Thanks to: https://github.com/prometheus-community/monaco-promql/blob/master/src/promql/promql.ts
  // As well as: https://kausal.co/blog/slate-prism-add-new-syntax-promql/
  ;(function (Prism) {
    // PromQL Aggregation Operators
    // (https://prometheus.io/docs/prometheus/latest/querying/operators/#aggregation-operators)
    var aggregations = [
      'sum',
      'min',
      'max',
      'avg',
      'group',
      'stddev',
      'stdvar',
      'count',
      'count_values',
      'bottomk',
      'topk',
      'quantile'
    ] // PromQL vector matching + the by and without clauses
    // (https://prometheus.io/docs/prometheus/latest/querying/operators/#vector-matching)
    var vectorMatching = [
      'on',
      'ignoring',
      'group_right',
      'group_left',
      'by',
      'without'
    ] // PromQL offset modifier
    // (https://prometheus.io/docs/prometheus/latest/querying/basics/#offset-modifier)
    var offsetModifier = ['offset']
    var keywords = aggregations.concat(vectorMatching, offsetModifier)
    Prism.languages.promql = {
      comment: {
        pattern: /(^[ \t]*)#.*/m,
        lookbehind: true
      },
      'vector-match': {
        // Match the comma-separated label lists inside vector matching:
        pattern: new RegExp(
          '((?:' + vectorMatching.join('|') + ')\\s*)\\([^)]*\\)'
        ),
        lookbehind: true,
        inside: {
          'label-key': {
            pattern: /\b[^,]+\b/,
            alias: 'attr-name'
          },
          punctuation: /[(),]/
        }
      },
      'context-labels': {
        pattern: /\{[^{}]*\}/,
        inside: {
          'label-key': {
            pattern: /\b[a-z_]\w*(?=\s*(?:=|![=~]))/,
            alias: 'attr-name'
          },
          'label-value': {
            pattern: /(["'`])(?:\\[\s\S]|(?!\1)[^\\])*\1/,
            greedy: true,
            alias: 'attr-value'
          },
          punctuation: /\{|\}|=~?|![=~]|,/
        }
      },
      'context-range': [
        {
          pattern: /\[[\w\s:]+\]/,
          // [1m]
          inside: {
            punctuation: /\[|\]|:/,
            'range-duration': {
              pattern: /\b(?:\d+(?:[smhdwy]|ms))+\b/i,
              alias: 'number'
            }
          }
        },
        {
          pattern: /(\boffset\s+)\w+/,
          // offset 1m
          lookbehind: true,
          inside: {
            'range-duration': {
              pattern: /\b(?:\d+(?:[smhdwy]|ms))+\b/i,
              alias: 'number'
            }
          }
        }
      ],
      keyword: new RegExp('\\b(?:' + keywords.join('|') + ')\\b', 'i'),
      function: /\b[a-z_]\w*(?=\s*\()/i,
      number:
        /[-+]?(?:(?:\b\d+(?:\.\d+)?|\B\.\d+)(?:e[-+]?\d+)?\b|\b(?:0x[0-9a-f]+|nan|inf)\b)/i,
      operator: /[\^*/%+-]|==|!=|<=|<|>=|>|\b(?:and|unless|or)\b/i,
      punctuation: /[{};()`,.[\]]/
    }
  })(Prism)
}

},{}],"../node_modules/refractor/lang/psl.js":[function(require,module,exports) {
'use strict'

module.exports = psl
psl.displayName = 'psl'
psl.aliases = []
function psl(Prism) {
  Prism.languages.psl = {
    comment: {
      pattern: /#.*/,
      greedy: true
    },
    string: {
      pattern: /"(?:\\.|[^\\"])*"/,
      greedy: true,
      inside: {
        symbol: /\\[ntrbA-Z"\\]/
      }
    },
    'heredoc-string': {
      pattern: /<<<([a-zA-Z_]\w*)[\r\n](?:.*[\r\n])*?\1\b/,
      alias: 'string',
      greedy: true
    },
    keyword:
      /\b(?:__multi|__single|case|default|do|else|elsif|exit|export|for|foreach|function|if|last|line|local|next|requires|return|switch|until|while|word)\b/,
    constant:
      /\b(?:ALARM|CHART_ADD_GRAPH|CHART_DELETE_GRAPH|CHART_DESTROY|CHART_LOAD|CHART_PRINT|EOF|FALSE|False|false|NO|No|no|OFFLINE|OK|PSL_PROF_LOG|R_CHECK_HORIZ|R_CHECK_VERT|R_CLICKER|R_COLUMN|R_FRAME|R_ICON|R_LABEL|R_LABEL_CENTER|R_LIST_MULTIPLE|R_LIST_MULTIPLE_ND|R_LIST_SINGLE|R_LIST_SINGLE_ND|R_MENU|R_POPUP|R_POPUP_SCROLLED|R_RADIO_HORIZ|R_RADIO_VERT|R_ROW|R_SCALE_HORIZ|R_SCALE_VERT|R_SPINNER|R_TEXT_FIELD|R_TEXT_FIELD_LABEL|R_TOGGLE|TRIM_LEADING|TRIM_LEADING_AND_TRAILING|TRIM_REDUNDANT|TRIM_TRAILING|TRUE|True|true|VOID|WARN)\b/,
    variable: /\b(?:errno|exit_status|PslDebug)\b/,
    builtin: {
      pattern:
        /\b(?:acos|add_diary|annotate|annotate_get|asctime|asin|atan|atexit|ascii_to_ebcdic|batch_set|blackout|cat|ceil|chan_exists|change_state|close|code_cvt|cond_signal|cond_wait|console_type|convert_base|convert_date|convert_locale_date|cos|cosh|create|destroy_lock|dump_hist|date|destroy|difference|dget_text|dcget_text|ebcdic_to_ascii|encrypt|event_archive|event_catalog_get|event_check|event_query|event_range_manage|event_range_query|event_report|event_schedule|event_trigger|event_trigger2|execute|exists|exp|fabs|floor|fmod|full_discovery|file|fopen|ftell|fseek|grep|get_vars|getenv|get|get_chan_info|get_ranges|get_text|gethostinfo|getpid|getpname|history_get_retention|history|index|int|is_var|intersection|isnumber|internal|in_transition|join|kill|length|lines|lock|lock_info|log|loge|log10|matchline|msg_check|msg_get_format|msg_get_severity|msg_printf|msg_sprintf|ntharg|num_consoles|nthargf|nthline|nthlinef|num_bytes|print|proc_exists|process|popen|printf|pconfig|poplines|pow|PslExecute|PslFunctionCall|PslFunctionExists|PslSetOptions|random|read|readln|refresh_parameters|remote_check|remote_close|remote_event_query|remote_event_trigger|remote_file_send|remote_open|remove|replace|rindex|sec_check_priv|sec_store_get|sec_store_set|set_alarm_ranges|set_locale|share|sin|sinh|sleep|sopen|sqrt|srandom|subset|set|substr|system|sprintf|sort|snmp_agent_config|_snmp_debug|snmp_agent_stop|snmp_agent_start|snmp_h_set|snmp_h_get_next|snmp_h_get|snmp_set|snmp_walk|snmp_get_next|snmp_get|snmp_config|snmp_close|snmp_open|snmp_trap_receive|snmp_trap_ignore|snmp_trap_listen|snmp_trap_send|snmp_trap_raise_std_trap|snmp_trap_register_im|splitline|strcasecmp|str_repeat|trim|tail|tan|tanh|time|tmpnam|tolower|toupper|trace_psl_process|text_domain|unlock|unique|union|unset|va_arg|va_start|write)\b/,
      alias: 'builtin-function'
    },
    'foreach-variable': {
      pattern:
        /(\bforeach\s+(?:(?:\w+\b|"(?:\\.|[^\\"])*")\s+){0,2})[_a-zA-Z]\w*(?=\s*\()/,
      lookbehind: true,
      greedy: true
    },
    function: {
      pattern: /\b[_a-z]\w*\b(?=\s*\()/i
    },
    number: /\b(?:0x[0-9a-f]+|[0-9]+(?:\.[0-9]+)?)\b/i,
    operator: /--|\+\+|&&=?|\|\|=?|<<=?|>>=?|[=!]~|[-+*/%&|^!=<>]=?|\.|[:?]/,
    punctuation: /[(){}\[\];,]/
  }
}

},{}],"../node_modules/refractor/lang/qsharp.js":[function(require,module,exports) {
'use strict'

module.exports = qsharp
qsharp.displayName = 'qsharp'
qsharp.aliases = ['qs']
function qsharp(Prism) {
  ;(function (Prism) {
    /**
     * Replaces all placeholders "<<n>>" of given pattern with the n-th replacement (zero based).
     *
     * Note: This is a simple text based replacement. Be careful when using backreferences!
     *
     * @param {string} pattern the given pattern.
     * @param {string[]} replacements a list of replacement which can be inserted into the given pattern.
     * @returns {string} the pattern with all placeholders replaced with their corresponding replacements.
     * @example replace(/a<<0>>a/.source, [/b+/.source]) === /a(?:b+)a/.source
     */
    function replace(pattern, replacements) {
      return pattern.replace(/<<(\d+)>>/g, function (m, index) {
        return '(?:' + replacements[+index] + ')'
      })
    }
    /**
     * @param {string} pattern
     * @param {string[]} replacements
     * @param {string} [flags]
     * @returns {RegExp}
     */
    function re(pattern, replacements, flags) {
      return RegExp(replace(pattern, replacements), flags || '')
    }
    /**
     * Creates a nested pattern where all occurrences of the string `<<self>>` are replaced with the pattern itself.
     *
     * @param {string} pattern
     * @param {number} depthLog2
     * @returns {string}
     */
    function nested(pattern, depthLog2) {
      for (var i = 0; i < depthLog2; i++) {
        pattern = pattern.replace(/<<self>>/g, function () {
          return '(?:' + pattern + ')'
        })
      }
      return pattern.replace(/<<self>>/g, '[^\\s\\S]')
    } // https://docs.microsoft.com/en-us/azure/quantum/user-guide/language/typesystem/
    // https://github.com/microsoft/qsharp-language/tree/main/Specifications/Language/5_Grammar
    var keywordKinds = {
      // keywords which represent a return or variable type
      type: 'Adj BigInt Bool Ctl Double false Int One Pauli PauliI PauliX PauliY PauliZ Qubit Range Result String true Unit Zero',
      // all other keywords
      other:
        'Adjoint adjoint apply as auto body borrow borrowing Controlled controlled distribute elif else fail fixup for function if in internal intrinsic invert is let mutable namespace new newtype open operation repeat return self set until use using while within'
    } // keywords
    function keywordsToPattern(words) {
      return '\\b(?:' + words.trim().replace(/ /g, '|') + ')\\b'
    }
    var keywords = RegExp(
      keywordsToPattern(keywordKinds.type + ' ' + keywordKinds.other)
    ) // types
    var identifier = /\b[A-Za-z_]\w*\b/.source
    var qualifiedName = replace(/<<0>>(?:\s*\.\s*<<0>>)*/.source, [identifier])
    var typeInside = {
      keyword: keywords,
      punctuation: /[<>()?,.:[\]]/
    } // strings
    var regularString = /"(?:\\.|[^\\"])*"/.source
    Prism.languages.qsharp = Prism.languages.extend('clike', {
      comment: /\/\/.*/,
      string: [
        {
          pattern: re(/(^|[^$\\])<<0>>/.source, [regularString]),
          lookbehind: true,
          greedy: true
        }
      ],
      'class-name': [
        {
          // open Microsoft.Quantum.Canon;
          // open Microsoft.Quantum.Canon as CN;
          pattern: re(/(\b(?:as|open)\s+)<<0>>(?=\s*(?:;|as\b))/.source, [
            qualifiedName
          ]),
          lookbehind: true,
          inside: typeInside
        },
        {
          // namespace Quantum.App1;
          pattern: re(/(\bnamespace\s+)<<0>>(?=\s*\{)/.source, [qualifiedName]),
          lookbehind: true,
          inside: typeInside
        }
      ],
      keyword: keywords,
      number:
        /(?:\b0(?:x[\da-f]+|b[01]+|o[0-7]+)|(?:\B\.\d+|\b\d+(?:\.\d*)?)(?:e[-+]?\d+)?)l?\b/i,
      operator:
        /\band=|\bor=|\band\b|\bor\b|\bnot\b|<[-=]|[-=]>|>>>=?|<<<=?|\^\^\^=?|\|\|\|=?|&&&=?|w\/=?|~~~|[*\/+\-^=!%]=?/,
      punctuation: /::|[{}[\];(),.:]/
    })
    Prism.languages.insertBefore('qsharp', 'number', {
      range: {
        pattern: /\.\./,
        alias: 'operator'
      }
    }) // single line
    var interpolationExpr = nested(
      replace(/\{(?:[^"{}]|<<0>>|<<self>>)*\}/.source, [regularString]),
      2
    )
    Prism.languages.insertBefore('qsharp', 'string', {
      'interpolation-string': {
        pattern: re(/\$"(?:\\.|<<0>>|[^\\"{])*"/.source, [interpolationExpr]),
        greedy: true,
        inside: {
          interpolation: {
            pattern: re(/((?:^|[^\\])(?:\\\\)*)<<0>>/.source, [
              interpolationExpr
            ]),
            lookbehind: true,
            inside: {
              punctuation: /^\{|\}$/,
              expression: {
                pattern: /[\s\S]+/,
                alias: 'language-qsharp',
                inside: Prism.languages.qsharp
              }
            }
          },
          string: /[\s\S]+/
        }
      }
    })
  })(Prism)
  Prism.languages.qs = Prism.languages.qsharp
}

},{}],"../node_modules/refractor/lang/rego.js":[function(require,module,exports) {
'use strict'

module.exports = rego
rego.displayName = 'rego'
rego.aliases = []
function rego(Prism) {
  // https://www.openpolicyagent.org/docs/latest/policy-reference/
  Prism.languages.rego = {
    comment: /#.*/,
    property: {
      pattern:
        /(^|[^\\.])(?:"(?:\\.|[^\\"\r\n])*"|`[^`]*`|\b[a-z_]\w*\b)(?=\s*:(?!=))/i,
      lookbehind: true,
      greedy: true
    },
    string: {
      pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"|`[^`]*`/,
      lookbehind: true,
      greedy: true
    },
    keyword:
      /\b(?:as|default|else|import|package|not|null|some|with|set(?=\s*\())\b/,
    boolean: /\b(?:true|false)\b/,
    function: {
      pattern: /\b[a-z_]\w*\b(?:\s*\.\s*\b[a-z_]\w*\b)*(?=\s*\()/i,
      inside: {
        namespace: /\b\w+\b(?=\s*\.)/,
        punctuation: /\./
      }
    },
    number: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
    operator: /[-+*/%|&]|[<>:=]=?|!=|\b_\b/,
    punctuation: /[,;.\[\]{}()]/
  }
}

},{}],"../node_modules/refractor/lang/squirrel.js":[function(require,module,exports) {
'use strict'

module.exports = squirrel
squirrel.displayName = 'squirrel'
squirrel.aliases = []
function squirrel(Prism) {
  Prism.languages.squirrel = Prism.languages.extend('clike', {
    comment: [
      Prism.languages.clike['comment'][0],
      {
        pattern: /(^|[^\\:])(?:\/\/|#).*/,
        lookbehind: true,
        greedy: true
      }
    ],
    string: [
      {
        pattern: /(^|[^\\"'@])(?:@"(?:[^"]|"")*"(?!")|"(?:[^\\\r\n"]|\\.)*")/,
        lookbehind: true,
        greedy: true
      },
      {
        pattern: /(^|[^\\"'])'(?:[^\\']|\\(?:[xuU][0-9a-fA-F]{0,8}|[\s\S]))'/,
        lookbehind: true,
        greedy: true
      }
    ],
    'class-name': {
      pattern: /(\b(?:class|enum|extends|instanceof)\s+)\w+(?:\.\w+)*/,
      lookbehind: true,
      inside: {
        punctuation: /\./
      }
    },
    keyword:
      /\b(?:base|break|case|catch|class|clone|const|constructor|continue|default|delete|else|enum|extends|for|foreach|function|if|in|instanceof|local|null|resume|return|static|switch|this|throw|try|typeof|while|yield|__LINE__|__FILE__)\b/,
    number: /\b(?:0x[0-9a-fA-F]+|\d+(?:\.(?:\d+|[eE][+-]?\d+))?)\b/,
    operator: /\+\+|--|<=>|<[-<]|>>>?|&&?|\|\|?|[-+*/%!=<>]=?|[~^]|::?/,
    punctuation: /[(){}\[\],;.]/
  })
  Prism.languages.insertBefore('squirrel', 'operator', {
    'attribute-punctuation': {
      pattern: /<\/|\/>/,
      alias: 'important'
    },
    lambda: {
      pattern: /@(?=\()/,
      alias: 'operator'
    }
  })
}

},{}],"../node_modules/refractor/lang/systemd.js":[function(require,module,exports) {
'use strict'

module.exports = systemd
systemd.displayName = 'systemd'
systemd.aliases = []
function systemd(Prism) {
  // https://www.freedesktop.org/software/systemd/man/systemd.syntax.html
  ;(function (Prism) {
    var comment = {
      pattern: /^[;#].*/m,
      greedy: true
    }
    var quotesSource = /"(?:[^\r\n"\\]|\\(?:[^\r]|\r\n?))*"(?!\S)/.source
    Prism.languages.systemd = {
      comment: comment,
      section: {
        pattern: /^\[[^\n\r\[\]]*\](?=[ \t]*$)/m,
        greedy: true,
        inside: {
          punctuation: /^\[|\]$/,
          'section-name': {
            pattern: /[\s\S]+/,
            alias: 'selector'
          }
        }
      },
      key: {
        pattern: /^[^\s=]+(?=[ \t]*=)/m,
        greedy: true,
        alias: 'attr-name'
      },
      value: {
        // This pattern is quite complex because of two properties:
        //  1) Quotes (strings) must be preceded by a space. Since we can't use lookbehinds, we have to "resolve"
        //     the lookbehind. You will see this in the main loop where spaces are handled separately.
        //  2) Line continuations.
        //     After line continuations, empty lines and comments are ignored so we have to consume them.
        pattern: RegExp(
          /(=[ \t]*(?!\s))/.source + // the value either starts with quotes or not
            '(?:' +
            quotesSource +
            '|(?=[^"\r\n]))' + // main loop
            '(?:' +
            (/[^\s\\]/.source + // handle spaces separately because of quotes
              '|' +
              '[ \t]+(?:(?![ \t"])|' +
              quotesSource +
              ')' + // line continuation
              '|' +
              /\\[\r\n]+(?:[#;].*[\r\n]+)*(?![#;])/.source) +
            ')*'
        ),
        lookbehind: true,
        greedy: true,
        alias: 'attr-value',
        inside: {
          comment: comment,
          quoted: {
            pattern: RegExp(/(^|\s)/.source + quotesSource),
            lookbehind: true,
            greedy: true
          },
          punctuation: /\\$/m,
          boolean: {
            pattern: /^(?:false|no|off|on|true|yes)$/,
            greedy: true
          }
        }
      },
      operator: /=/
    }
  })(Prism)
}

},{}],"../node_modules/refractor/lang/uri.js":[function(require,module,exports) {
'use strict'

module.exports = uri
uri.displayName = 'uri'
uri.aliases = ['url']
function uri(Prism) {
  // https://tools.ietf.org/html/rfc3986#appendix-A
  Prism.languages.uri = {
    scheme: {
      pattern: /^[a-z][a-z0-9+.-]*:/im,
      greedy: true,
      inside: {
        'scheme-delimiter': /:$/
      }
    },
    fragment: {
      pattern: /#[\w\-.~!$&'()*+,;=%:@/?]*/,
      inside: {
        'fragment-delimiter': /^#/
      }
    },
    query: {
      pattern: /\?[\w\-.~!$&'()*+,;=%:@/?]*/,
      inside: {
        'query-delimiter': {
          pattern: /^\?/,
          greedy: true
        },
        'pair-delimiter': /[&;]/,
        pair: {
          pattern: /^[^=][\s\S]*/,
          inside: {
            key: /^[^=]+/,
            value: {
              pattern: /(^=)[\s\S]+/,
              lookbehind: true
            }
          }
        }
      }
    },
    authority: {
      pattern: RegExp(
        /^\/\//.source + // [ userinfo "@" ]
          /(?:[\w\-.~!$&'()*+,;=%:]*@)?/.source + // host
          ('(?:' + // IP-literal
            /\[(?:[0-9a-fA-F:.]{2,48}|v[0-9a-fA-F]+\.[\w\-.~!$&'()*+,;=]+)\]/
              .source +
            '|' + // IPv4address or registered name
            /[\w\-.~!$&'()*+,;=%]*/.source +
            ')') + // [ ":" port ]
          /(?::\d*)?/.source,
        'm'
      ),
      inside: {
        'authority-delimiter': /^\/\//,
        'user-info-segment': {
          pattern: /^[\w\-.~!$&'()*+,;=%:]*@/,
          inside: {
            'user-info-delimiter': /@$/,
            'user-info': /^[\w\-.~!$&'()*+,;=%:]+/
          }
        },
        'port-segment': {
          pattern: /:\d*$/,
          inside: {
            'port-delimiter': /^:/,
            port: /^\d+/
          }
        },
        host: {
          pattern: /[\s\S]+/,
          inside: {
            'ip-literal': {
              pattern: /^\[[\s\S]+\]$/,
              inside: {
                'ip-literal-delimiter': /^\[|\]$/,
                'ipv-future': /^v[\s\S]+/,
                'ipv6-address': /^[\s\S]+/
              }
            },
            'ipv4-address':
              /^(?:(?:[03-9]\d?|[12]\d{0,2})\.){3}(?:[03-9]\d?|[12]{0,2})$/
          }
        }
      }
    },
    path: {
      pattern: /^[\w\-.~!$&'()*+,;=%:@/]+/m,
      inside: {
        'path-separator': /\//
      }
    }
  }
  Prism.languages.url = Prism.languages.uri
}

},{}],"../node_modules/refractor/lang/v.js":[function(require,module,exports) {
'use strict'

module.exports = v
v.displayName = 'v'
v.aliases = []
function v(Prism) {
  ;(function (Prism) {
    var interpolationExpr = {
      pattern: /[\s\S]+/,
      inside: null
    }
    Prism.languages.v = Prism.languages.extend('clike', {
      string: [
        {
          pattern: /`(?:\\`|\\?[^`]{1,2})`/,
          // using {1,2} instead of `u` flag for compatibility
          alias: 'rune'
        },
        {
          pattern: /r?(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
          alias: 'quoted-string',
          greedy: true,
          inside: {
            interpolation: {
              pattern:
                /((?:^|[^\\])(?:\\{2})*)\$(?:\{[^{}]*\}|\w+(?:\.\w+(?:\([^\(\)]*\))?|\[[^\[\]]+\])*)/,
              lookbehind: true,
              inside: {
                'interpolation-variable': {
                  pattern: /^\$\w[\s\S]*$/,
                  alias: 'variable'
                },
                'interpolation-punctuation': {
                  pattern: /^\$\{|\}$/,
                  alias: 'punctuation'
                },
                'interpolation-expression': interpolationExpr
              }
            }
          }
        }
      ],
      'class-name': {
        pattern: /(\b(?:enum|interface|struct|type)\s+)(?:C\.)?\w+/,
        lookbehind: true
      },
      keyword:
        /(?:\b(?:as|asm|assert|atomic|break|chan|const|continue|defer|else|embed|enum|fn|for|__global|go(?:to)?|if|import|in|interface|is|lock|match|module|mut|none|or|pub|return|rlock|select|shared|sizeof|static|struct|type(?:of)?|union|unsafe)|\$(?:if|else|for)|#(?:include|flag))\b/,
      number:
        /\b(?:0x[a-f\d]+(?:_[a-f\d]+)*|0b[01]+(?:_[01]+)*|0o[0-7]+(?:_[0-7]+)*|\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?)\b/i,
      operator:
        /~|\?|[*\/%^!=]=?|\+[=+]?|-[=-]?|\|[=|]?|&(?:=|&|\^=?)?|>(?:>=?|=)?|<(?:<=?|=|-)?|:=|\.\.\.?/,
      builtin:
        /\b(?:any(?:_int|_float)?|bool|byte(?:ptr)?|charptr|f(?:32|64)|i(?:8|16|nt|64|128)|rune|size_t|string|u(?:16|32|64|128)|voidptr)\b/
    })
    interpolationExpr.inside = Prism.languages.v
    Prism.languages.insertBefore('v', 'operator', {
      attribute: {
        pattern:
          /(^[\t ]*)\[(?:deprecated|unsafe_fn|typedef|live|inline|flag|ref_only|windows_stdcall|direct_array_access)\]/m,
        lookbehind: true,
        alias: 'annotation',
        inside: {
          punctuation: /[\[\]]/,
          keyword: /\w+/
        }
      },
      generic: {
        pattern: /<\w+>(?=\s*[\)\{])/,
        inside: {
          punctuation: /[<>]/,
          'class-name': /\w+/
        }
      }
    })
    Prism.languages.insertBefore('v', 'function', {
      'generic-function': {
        // e.g. foo<T>( ...
        pattern: /\b\w+\s*<\w+>(?=\()/,
        inside: {
          function: /^\w+/,
          generic: {
            pattern: /<\w+>/,
            inside: Prism.languages.v.generic.inside
          }
        }
      }
    })
  })(Prism)
}

},{}],"../node_modules/refractor/lang/wolfram.js":[function(require,module,exports) {
'use strict'

module.exports = wolfram
wolfram.displayName = 'wolfram'
wolfram.aliases = ['mathematica', 'wl', 'nb']
function wolfram(Prism) {
  Prism.languages.wolfram = {
    // Allow one level of nesting - note: regex taken from applescipt
    comment: /\(\*(?:\(\*(?:[^*]|\*(?!\)))*\*\)|(?!\(\*)[\s\S])*?\*\)/,
    string: {
      pattern: /"(?:\\.|[^"\\\r\n])*"/,
      greedy: true
    },
    keyword:
      /\b(?:Abs|AbsArg|Accuracy|Block|Do|For|Function|If|Manipulate|Module|Nest|NestList|None|Return|Switch|Table|Which|While)\b/,
    context: {
      pattern: /\w+`+\w*/,
      alias: 'class-name'
    },
    blank: {
      pattern: /\b\w+_\b/,
      alias: 'regex'
    },
    'global-variable': {
      pattern: /\$\w+/,
      alias: 'variable'
    },
    boolean: /\b(?:True|False)\b/,
    number:
      /(?:\b(?=\d)|\B(?=\.))(?:0[bo])?(?:(?:\d|0x[\da-f])[\da-f]*(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?j?\b/i,
    operator:
      /\/\.|;|=\.|\^=|\^:=|:=|<<|>>|<\||\|>|:>|\|->|->|<-|@@@|@@|@|\/@|=!=|===|==|=|\+|-|\^|\[\/-+%=\]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
    punctuation: /[\|{}[\];(),.:]/
  }
  Prism.languages.mathematica = Prism.languages.wolfram
  Prism.languages.wl = Prism.languages.wolfram
  Prism.languages.nb = Prism.languages.wolfram
}

},{}],"../node_modules/refractor/lang/wren.js":[function(require,module,exports) {
'use strict'

module.exports = wren
wren.displayName = 'wren'
wren.aliases = []
function wren(Prism) {
  // https://wren.io/
  Prism.languages.wren = {
    // Multiline comments in Wren can have nested multiline comments
    // Comments: // and /* */
    comment: [
      {
        // support 3 levels of nesting
        // regex: \/\*(?:[^*/]|\*(?!\/)|\/(?!\*)|<self>)*\*\/
        pattern:
          /\/\*(?:[^*/]|\*(?!\/)|\/(?!\*)|\/\*(?:[^*/]|\*(?!\/)|\/(?!\*)|\/\*(?:[^*/]|\*(?!\/)|\/(?!\*))*\*\/)*\*\/)*\*\//,
        greedy: true
      },
      {
        pattern: /(^|[^\\:])\/\/.*/,
        lookbehind: true,
        greedy: true
      }
    ],
    // Triple quoted strings are multiline but cannot have interpolation (raw strings)
    // Based on prism-python.js
    'triple-quoted-string': {
      pattern: /"""[\s\S]*?"""/,
      greedy: true,
      alias: 'string'
    },
    // see below
    'string-literal': null,
    // #!/usr/bin/env wren on the first line
    hashbang: {
      pattern: /^#!\/.+/,
      greedy: true,
      alias: 'comment'
    },
    // Attributes are special keywords to add meta data to classes
    attribute: {
      // #! attributes are stored in class properties
      // #!myvar = true
      // #attributes are not stored and dismissed at compilation
      pattern: /#!?[ \t\u3000]*\w+/,
      alias: 'keyword'
    },
    'class-name': [
      {
        // class definition
        // class Meta {}
        pattern: /(\bclass\s+)\w+/,
        lookbehind: true
      }, // A class must always start with an uppercase.
      // File.read
      /\b[A-Z][a-z\d_]*\b/
    ],
    // A constant can be a variable, class, property or method. Just named in all uppercase letters
    constant: /\b[A-Z][A-Z\d_]*\b/,
    null: {
      pattern: /\bnull\b/,
      alias: 'keyword'
    },
    keyword:
      /\b(?:as|break|class|construct|continue|else|for|foreign|if|import|in|is|return|static|super|this|var|while)\b/,
    boolean: /\b(?:true|false)\b/,
    number: /\b(?:0x[\da-f]+|\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/i,
    // Functions can be Class.method()
    function: /\b[a-z_]\w*(?=\s*[({])/i,
    operator: /<<|>>|[=!<>]=?|&&|\|\||[-+*/%~^&|?:]|\.{2,3}/,
    punctuation: /[\[\](){}.,;]/
  }
  Prism.languages.wren['string-literal'] = {
    // A single quote string is multiline and can have interpolation (similar to JS backticks ``)
    pattern:
      /(^|[^\\"])"(?:[^\\"%]|\\[\s\S]|%(?!\()|%\((?:[^()]|\((?:[^()]|\([^)]*\))*\))*\))*"/,
    lookbehind: true,
    greedy: true,
    inside: {
      interpolation: {
        // "%(interpolation)"
        pattern:
          /((?:^|[^\\])(?:\\{2})*)%\((?:[^()]|\((?:[^()]|\([^)]*\))*\))*\)/,
        lookbehind: true,
        inside: {
          expression: {
            pattern: /^(%\()[\s\S]+(?=\)$)/,
            lookbehind: true,
            inside: Prism.languages.wren
          },
          'interpolation-punctuation': {
            pattern: /^%\(|\)$/,
            alias: 'punctuation'
          }
        }
      },
      string: /[\s\S]+/
    }
  }
}

},{}],"../node_modules/refractor/index.js":[function(require,module,exports) {
'use strict'

var refractor = require('./core.js')

module.exports = refractor

refractor.register(require('./lang/abap.js'))
refractor.register(require('./lang/abnf.js'))
refractor.register(require('./lang/actionscript.js'))
refractor.register(require('./lang/ada.js'))
refractor.register(require('./lang/agda.js'))
refractor.register(require('./lang/al.js'))
refractor.register(require('./lang/antlr4.js'))
refractor.register(require('./lang/apacheconf.js'))
refractor.register(require('./lang/apex.js'))
refractor.register(require('./lang/apl.js'))
refractor.register(require('./lang/applescript.js'))
refractor.register(require('./lang/aql.js'))
refractor.register(require('./lang/arduino.js'))
refractor.register(require('./lang/arff.js'))
refractor.register(require('./lang/asciidoc.js'))
refractor.register(require('./lang/asm6502.js'))
refractor.register(require('./lang/aspnet.js'))
refractor.register(require('./lang/autohotkey.js'))
refractor.register(require('./lang/autoit.js'))
refractor.register(require('./lang/avisynth.js'))
refractor.register(require('./lang/avro-idl.js'))
refractor.register(require('./lang/bash.js'))
refractor.register(require('./lang/basic.js'))
refractor.register(require('./lang/batch.js'))
refractor.register(require('./lang/bbcode.js'))
refractor.register(require('./lang/bicep.js'))
refractor.register(require('./lang/birb.js'))
refractor.register(require('./lang/bison.js'))
refractor.register(require('./lang/bnf.js'))
refractor.register(require('./lang/brainfuck.js'))
refractor.register(require('./lang/brightscript.js'))
refractor.register(require('./lang/bro.js'))
refractor.register(require('./lang/bsl.js'))
refractor.register(require('./lang/c.js'))
refractor.register(require('./lang/cfscript.js'))
refractor.register(require('./lang/chaiscript.js'))
refractor.register(require('./lang/cil.js'))
refractor.register(require('./lang/clojure.js'))
refractor.register(require('./lang/cmake.js'))
refractor.register(require('./lang/cobol.js'))
refractor.register(require('./lang/coffeescript.js'))
refractor.register(require('./lang/concurnas.js'))
refractor.register(require('./lang/coq.js'))
refractor.register(require('./lang/cpp.js'))
refractor.register(require('./lang/crystal.js'))
refractor.register(require('./lang/csharp.js'))
refractor.register(require('./lang/cshtml.js'))
refractor.register(require('./lang/csp.js'))
refractor.register(require('./lang/css-extras.js'))
refractor.register(require('./lang/csv.js'))
refractor.register(require('./lang/cypher.js'))
refractor.register(require('./lang/d.js'))
refractor.register(require('./lang/dart.js'))
refractor.register(require('./lang/dataweave.js'))
refractor.register(require('./lang/dax.js'))
refractor.register(require('./lang/dhall.js'))
refractor.register(require('./lang/diff.js'))
refractor.register(require('./lang/django.js'))
refractor.register(require('./lang/dns-zone-file.js'))
refractor.register(require('./lang/docker.js'))
refractor.register(require('./lang/dot.js'))
refractor.register(require('./lang/ebnf.js'))
refractor.register(require('./lang/editorconfig.js'))
refractor.register(require('./lang/eiffel.js'))
refractor.register(require('./lang/ejs.js'))
refractor.register(require('./lang/elixir.js'))
refractor.register(require('./lang/elm.js'))
refractor.register(require('./lang/erb.js'))
refractor.register(require('./lang/erlang.js'))
refractor.register(require('./lang/etlua.js'))
refractor.register(require('./lang/excel-formula.js'))
refractor.register(require('./lang/factor.js'))
refractor.register(require('./lang/false.js'))
refractor.register(require('./lang/firestore-security-rules.js'))
refractor.register(require('./lang/flow.js'))
refractor.register(require('./lang/fortran.js'))
refractor.register(require('./lang/fsharp.js'))
refractor.register(require('./lang/ftl.js'))
refractor.register(require('./lang/gap.js'))
refractor.register(require('./lang/gcode.js'))
refractor.register(require('./lang/gdscript.js'))
refractor.register(require('./lang/gedcom.js'))
refractor.register(require('./lang/gherkin.js'))
refractor.register(require('./lang/git.js'))
refractor.register(require('./lang/glsl.js'))
refractor.register(require('./lang/gml.js'))
refractor.register(require('./lang/gn.js'))
refractor.register(require('./lang/go.js'))
refractor.register(require('./lang/graphql.js'))
refractor.register(require('./lang/groovy.js'))
refractor.register(require('./lang/haml.js'))
refractor.register(require('./lang/handlebars.js'))
refractor.register(require('./lang/haskell.js'))
refractor.register(require('./lang/haxe.js'))
refractor.register(require('./lang/hcl.js'))
refractor.register(require('./lang/hlsl.js'))
refractor.register(require('./lang/hoon.js'))
refractor.register(require('./lang/hpkp.js'))
refractor.register(require('./lang/hsts.js'))
refractor.register(require('./lang/http.js'))
refractor.register(require('./lang/ichigojam.js'))
refractor.register(require('./lang/icon.js'))
refractor.register(require('./lang/icu-message-format.js'))
refractor.register(require('./lang/idris.js'))
refractor.register(require('./lang/iecst.js'))
refractor.register(require('./lang/ignore.js'))
refractor.register(require('./lang/inform7.js'))
refractor.register(require('./lang/ini.js'))
refractor.register(require('./lang/io.js'))
refractor.register(require('./lang/j.js'))
refractor.register(require('./lang/java.js'))
refractor.register(require('./lang/javadoc.js'))
refractor.register(require('./lang/javadoclike.js'))
refractor.register(require('./lang/javastacktrace.js'))
refractor.register(require('./lang/jexl.js'))
refractor.register(require('./lang/jolie.js'))
refractor.register(require('./lang/jq.js'))
refractor.register(require('./lang/js-extras.js'))
refractor.register(require('./lang/js-templates.js'))
refractor.register(require('./lang/jsdoc.js'))
refractor.register(require('./lang/json.js'))
refractor.register(require('./lang/json5.js'))
refractor.register(require('./lang/jsonp.js'))
refractor.register(require('./lang/jsstacktrace.js'))
refractor.register(require('./lang/jsx.js'))
refractor.register(require('./lang/julia.js'))
refractor.register(require('./lang/keyman.js'))
refractor.register(require('./lang/kotlin.js'))
refractor.register(require('./lang/kumir.js'))
refractor.register(require('./lang/kusto.js'))
refractor.register(require('./lang/latex.js'))
refractor.register(require('./lang/latte.js'))
refractor.register(require('./lang/less.js'))
refractor.register(require('./lang/lilypond.js'))
refractor.register(require('./lang/liquid.js'))
refractor.register(require('./lang/lisp.js'))
refractor.register(require('./lang/livescript.js'))
refractor.register(require('./lang/llvm.js'))
refractor.register(require('./lang/log.js'))
refractor.register(require('./lang/lolcode.js'))
refractor.register(require('./lang/lua.js'))
refractor.register(require('./lang/magma.js'))
refractor.register(require('./lang/makefile.js'))
refractor.register(require('./lang/markdown.js'))
refractor.register(require('./lang/markup-templating.js'))
refractor.register(require('./lang/matlab.js'))
refractor.register(require('./lang/maxscript.js'))
refractor.register(require('./lang/mel.js'))
refractor.register(require('./lang/mermaid.js'))
refractor.register(require('./lang/mizar.js'))
refractor.register(require('./lang/mongodb.js'))
refractor.register(require('./lang/monkey.js'))
refractor.register(require('./lang/moonscript.js'))
refractor.register(require('./lang/n1ql.js'))
refractor.register(require('./lang/n4js.js'))
refractor.register(require('./lang/nand2tetris-hdl.js'))
refractor.register(require('./lang/naniscript.js'))
refractor.register(require('./lang/nasm.js'))
refractor.register(require('./lang/neon.js'))
refractor.register(require('./lang/nevod.js'))
refractor.register(require('./lang/nginx.js'))
refractor.register(require('./lang/nim.js'))
refractor.register(require('./lang/nix.js'))
refractor.register(require('./lang/nsis.js'))
refractor.register(require('./lang/objectivec.js'))
refractor.register(require('./lang/ocaml.js'))
refractor.register(require('./lang/opencl.js'))
refractor.register(require('./lang/openqasm.js'))
refractor.register(require('./lang/oz.js'))
refractor.register(require('./lang/parigp.js'))
refractor.register(require('./lang/parser.js'))
refractor.register(require('./lang/pascal.js'))
refractor.register(require('./lang/pascaligo.js'))
refractor.register(require('./lang/pcaxis.js'))
refractor.register(require('./lang/peoplecode.js'))
refractor.register(require('./lang/perl.js'))
refractor.register(require('./lang/php-extras.js'))
refractor.register(require('./lang/php.js'))
refractor.register(require('./lang/phpdoc.js'))
refractor.register(require('./lang/plsql.js'))
refractor.register(require('./lang/powerquery.js'))
refractor.register(require('./lang/powershell.js'))
refractor.register(require('./lang/processing.js'))
refractor.register(require('./lang/prolog.js'))
refractor.register(require('./lang/promql.js'))
refractor.register(require('./lang/properties.js'))
refractor.register(require('./lang/protobuf.js'))
refractor.register(require('./lang/psl.js'))
refractor.register(require('./lang/pug.js'))
refractor.register(require('./lang/puppet.js'))
refractor.register(require('./lang/pure.js'))
refractor.register(require('./lang/purebasic.js'))
refractor.register(require('./lang/purescript.js'))
refractor.register(require('./lang/python.js'))
refractor.register(require('./lang/q.js'))
refractor.register(require('./lang/qml.js'))
refractor.register(require('./lang/qore.js'))
refractor.register(require('./lang/qsharp.js'))
refractor.register(require('./lang/r.js'))
refractor.register(require('./lang/racket.js'))
refractor.register(require('./lang/reason.js'))
refractor.register(require('./lang/regex.js'))
refractor.register(require('./lang/rego.js'))
refractor.register(require('./lang/renpy.js'))
refractor.register(require('./lang/rest.js'))
refractor.register(require('./lang/rip.js'))
refractor.register(require('./lang/roboconf.js'))
refractor.register(require('./lang/robotframework.js'))
refractor.register(require('./lang/ruby.js'))
refractor.register(require('./lang/rust.js'))
refractor.register(require('./lang/sas.js'))
refractor.register(require('./lang/sass.js'))
refractor.register(require('./lang/scala.js'))
refractor.register(require('./lang/scheme.js'))
refractor.register(require('./lang/scss.js'))
refractor.register(require('./lang/shell-session.js'))
refractor.register(require('./lang/smali.js'))
refractor.register(require('./lang/smalltalk.js'))
refractor.register(require('./lang/smarty.js'))
refractor.register(require('./lang/sml.js'))
refractor.register(require('./lang/solidity.js'))
refractor.register(require('./lang/solution-file.js'))
refractor.register(require('./lang/soy.js'))
refractor.register(require('./lang/sparql.js'))
refractor.register(require('./lang/splunk-spl.js'))
refractor.register(require('./lang/sqf.js'))
refractor.register(require('./lang/sql.js'))
refractor.register(require('./lang/squirrel.js'))
refractor.register(require('./lang/stan.js'))
refractor.register(require('./lang/stylus.js'))
refractor.register(require('./lang/swift.js'))
refractor.register(require('./lang/systemd.js'))
refractor.register(require('./lang/t4-cs.js'))
refractor.register(require('./lang/t4-templating.js'))
refractor.register(require('./lang/t4-vb.js'))
refractor.register(require('./lang/tap.js'))
refractor.register(require('./lang/tcl.js'))
refractor.register(require('./lang/textile.js'))
refractor.register(require('./lang/toml.js'))
refractor.register(require('./lang/tsx.js'))
refractor.register(require('./lang/tt2.js'))
refractor.register(require('./lang/turtle.js'))
refractor.register(require('./lang/twig.js'))
refractor.register(require('./lang/typescript.js'))
refractor.register(require('./lang/typoscript.js'))
refractor.register(require('./lang/unrealscript.js'))
refractor.register(require('./lang/uri.js'))
refractor.register(require('./lang/v.js'))
refractor.register(require('./lang/vala.js'))
refractor.register(require('./lang/vbnet.js'))
refractor.register(require('./lang/velocity.js'))
refractor.register(require('./lang/verilog.js'))
refractor.register(require('./lang/vhdl.js'))
refractor.register(require('./lang/vim.js'))
refractor.register(require('./lang/visual-basic.js'))
refractor.register(require('./lang/warpscript.js'))
refractor.register(require('./lang/wasm.js'))
refractor.register(require('./lang/wiki.js'))
refractor.register(require('./lang/wolfram.js'))
refractor.register(require('./lang/wren.js'))
refractor.register(require('./lang/xeora.js'))
refractor.register(require('./lang/xml-doc.js'))
refractor.register(require('./lang/xojo.js'))
refractor.register(require('./lang/xquery.js'))
refractor.register(require('./lang/yaml.js'))
refractor.register(require('./lang/yang.js'))
refractor.register(require('./lang/zig.js'))

},{"./core.js":"../node_modules/refractor/core.js","./lang/abap.js":"../node_modules/refractor/lang/abap.js","./lang/abnf.js":"../node_modules/refractor/lang/abnf.js","./lang/actionscript.js":"../node_modules/refractor/lang/actionscript.js","./lang/ada.js":"../node_modules/refractor/lang/ada.js","./lang/agda.js":"../node_modules/refractor/lang/agda.js","./lang/al.js":"../node_modules/refractor/lang/al.js","./lang/antlr4.js":"../node_modules/refractor/lang/antlr4.js","./lang/apacheconf.js":"../node_modules/refractor/lang/apacheconf.js","./lang/apex.js":"../node_modules/refractor/lang/apex.js","./lang/apl.js":"../node_modules/refractor/lang/apl.js","./lang/applescript.js":"../node_modules/refractor/lang/applescript.js","./lang/aql.js":"../node_modules/refractor/lang/aql.js","./lang/arduino.js":"../node_modules/refractor/lang/arduino.js","./lang/arff.js":"../node_modules/refractor/lang/arff.js","./lang/asciidoc.js":"../node_modules/refractor/lang/asciidoc.js","./lang/asm6502.js":"../node_modules/refractor/lang/asm6502.js","./lang/aspnet.js":"../node_modules/refractor/lang/aspnet.js","./lang/autohotkey.js":"../node_modules/refractor/lang/autohotkey.js","./lang/autoit.js":"../node_modules/refractor/lang/autoit.js","./lang/avisynth.js":"../node_modules/refractor/lang/avisynth.js","./lang/avro-idl.js":"../node_modules/refractor/lang/avro-idl.js","./lang/bash.js":"../node_modules/refractor/lang/bash.js","./lang/basic.js":"../node_modules/refractor/lang/basic.js","./lang/batch.js":"../node_modules/refractor/lang/batch.js","./lang/bbcode.js":"../node_modules/refractor/lang/bbcode.js","./lang/bicep.js":"../node_modules/refractor/lang/bicep.js","./lang/birb.js":"../node_modules/refractor/lang/birb.js","./lang/bison.js":"../node_modules/refractor/lang/bison.js","./lang/bnf.js":"../node_modules/refractor/lang/bnf.js","./lang/brainfuck.js":"../node_modules/refractor/lang/brainfuck.js","./lang/brightscript.js":"../node_modules/refractor/lang/brightscript.js","./lang/bro.js":"../node_modules/refractor/lang/bro.js","./lang/bsl.js":"../node_modules/refractor/lang/bsl.js","./lang/c.js":"../node_modules/refractor/lang/c.js","./lang/cfscript.js":"../node_modules/refractor/lang/cfscript.js","./lang/chaiscript.js":"../node_modules/refractor/lang/chaiscript.js","./lang/cil.js":"../node_modules/refractor/lang/cil.js","./lang/clojure.js":"../node_modules/refractor/lang/clojure.js","./lang/cmake.js":"../node_modules/refractor/lang/cmake.js","./lang/cobol.js":"../node_modules/refractor/lang/cobol.js","./lang/coffeescript.js":"../node_modules/refractor/lang/coffeescript.js","./lang/concurnas.js":"../node_modules/refractor/lang/concurnas.js","./lang/coq.js":"../node_modules/refractor/lang/coq.js","./lang/cpp.js":"../node_modules/refractor/lang/cpp.js","./lang/crystal.js":"../node_modules/refractor/lang/crystal.js","./lang/csharp.js":"../node_modules/refractor/lang/csharp.js","./lang/cshtml.js":"../node_modules/refractor/lang/cshtml.js","./lang/csp.js":"../node_modules/refractor/lang/csp.js","./lang/css-extras.js":"../node_modules/refractor/lang/css-extras.js","./lang/csv.js":"../node_modules/refractor/lang/csv.js","./lang/cypher.js":"../node_modules/refractor/lang/cypher.js","./lang/d.js":"../node_modules/refractor/lang/d.js","./lang/dart.js":"../node_modules/refractor/lang/dart.js","./lang/dataweave.js":"../node_modules/refractor/lang/dataweave.js","./lang/dax.js":"../node_modules/refractor/lang/dax.js","./lang/dhall.js":"../node_modules/refractor/lang/dhall.js","./lang/diff.js":"../node_modules/refractor/lang/diff.js","./lang/django.js":"../node_modules/refractor/lang/django.js","./lang/dns-zone-file.js":"../node_modules/refractor/lang/dns-zone-file.js","./lang/docker.js":"../node_modules/refractor/lang/docker.js","./lang/dot.js":"../node_modules/refractor/lang/dot.js","./lang/ebnf.js":"../node_modules/refractor/lang/ebnf.js","./lang/editorconfig.js":"../node_modules/refractor/lang/editorconfig.js","./lang/eiffel.js":"../node_modules/refractor/lang/eiffel.js","./lang/ejs.js":"../node_modules/refractor/lang/ejs.js","./lang/elixir.js":"../node_modules/refractor/lang/elixir.js","./lang/elm.js":"../node_modules/refractor/lang/elm.js","./lang/erb.js":"../node_modules/refractor/lang/erb.js","./lang/erlang.js":"../node_modules/refractor/lang/erlang.js","./lang/etlua.js":"../node_modules/refractor/lang/etlua.js","./lang/excel-formula.js":"../node_modules/refractor/lang/excel-formula.js","./lang/factor.js":"../node_modules/refractor/lang/factor.js","./lang/false.js":"../node_modules/refractor/lang/false.js","./lang/firestore-security-rules.js":"../node_modules/refractor/lang/firestore-security-rules.js","./lang/flow.js":"../node_modules/refractor/lang/flow.js","./lang/fortran.js":"../node_modules/refractor/lang/fortran.js","./lang/fsharp.js":"../node_modules/refractor/lang/fsharp.js","./lang/ftl.js":"../node_modules/refractor/lang/ftl.js","./lang/gap.js":"../node_modules/refractor/lang/gap.js","./lang/gcode.js":"../node_modules/refractor/lang/gcode.js","./lang/gdscript.js":"../node_modules/refractor/lang/gdscript.js","./lang/gedcom.js":"../node_modules/refractor/lang/gedcom.js","./lang/gherkin.js":"../node_modules/refractor/lang/gherkin.js","./lang/git.js":"../node_modules/refractor/lang/git.js","./lang/glsl.js":"../node_modules/refractor/lang/glsl.js","./lang/gml.js":"../node_modules/refractor/lang/gml.js","./lang/gn.js":"../node_modules/refractor/lang/gn.js","./lang/go.js":"../node_modules/refractor/lang/go.js","./lang/graphql.js":"../node_modules/refractor/lang/graphql.js","./lang/groovy.js":"../node_modules/refractor/lang/groovy.js","./lang/haml.js":"../node_modules/refractor/lang/haml.js","./lang/handlebars.js":"../node_modules/refractor/lang/handlebars.js","./lang/haskell.js":"../node_modules/refractor/lang/haskell.js","./lang/haxe.js":"../node_modules/refractor/lang/haxe.js","./lang/hcl.js":"../node_modules/refractor/lang/hcl.js","./lang/hlsl.js":"../node_modules/refractor/lang/hlsl.js","./lang/hoon.js":"../node_modules/refractor/lang/hoon.js","./lang/hpkp.js":"../node_modules/refractor/lang/hpkp.js","./lang/hsts.js":"../node_modules/refractor/lang/hsts.js","./lang/http.js":"../node_modules/refractor/lang/http.js","./lang/ichigojam.js":"../node_modules/refractor/lang/ichigojam.js","./lang/icon.js":"../node_modules/refractor/lang/icon.js","./lang/icu-message-format.js":"../node_modules/refractor/lang/icu-message-format.js","./lang/idris.js":"../node_modules/refractor/lang/idris.js","./lang/iecst.js":"../node_modules/refractor/lang/iecst.js","./lang/ignore.js":"../node_modules/refractor/lang/ignore.js","./lang/inform7.js":"../node_modules/refractor/lang/inform7.js","./lang/ini.js":"../node_modules/refractor/lang/ini.js","./lang/io.js":"../node_modules/refractor/lang/io.js","./lang/j.js":"../node_modules/refractor/lang/j.js","./lang/java.js":"../node_modules/refractor/lang/java.js","./lang/javadoc.js":"../node_modules/refractor/lang/javadoc.js","./lang/javadoclike.js":"../node_modules/refractor/lang/javadoclike.js","./lang/javastacktrace.js":"../node_modules/refractor/lang/javastacktrace.js","./lang/jexl.js":"../node_modules/refractor/lang/jexl.js","./lang/jolie.js":"../node_modules/refractor/lang/jolie.js","./lang/jq.js":"../node_modules/refractor/lang/jq.js","./lang/js-extras.js":"../node_modules/refractor/lang/js-extras.js","./lang/js-templates.js":"../node_modules/refractor/lang/js-templates.js","./lang/jsdoc.js":"../node_modules/refractor/lang/jsdoc.js","./lang/json.js":"../node_modules/refractor/lang/json.js","./lang/json5.js":"../node_modules/refractor/lang/json5.js","./lang/jsonp.js":"../node_modules/refractor/lang/jsonp.js","./lang/jsstacktrace.js":"../node_modules/refractor/lang/jsstacktrace.js","./lang/jsx.js":"../node_modules/refractor/lang/jsx.js","./lang/julia.js":"../node_modules/refractor/lang/julia.js","./lang/keyman.js":"../node_modules/refractor/lang/keyman.js","./lang/kotlin.js":"../node_modules/refractor/lang/kotlin.js","./lang/kumir.js":"../node_modules/refractor/lang/kumir.js","./lang/kusto.js":"../node_modules/refractor/lang/kusto.js","./lang/latex.js":"../node_modules/refractor/lang/latex.js","./lang/latte.js":"../node_modules/refractor/lang/latte.js","./lang/less.js":"../node_modules/refractor/lang/less.js","./lang/lilypond.js":"../node_modules/refractor/lang/lilypond.js","./lang/liquid.js":"../node_modules/refractor/lang/liquid.js","./lang/lisp.js":"../node_modules/refractor/lang/lisp.js","./lang/livescript.js":"../node_modules/refractor/lang/livescript.js","./lang/llvm.js":"../node_modules/refractor/lang/llvm.js","./lang/log.js":"../node_modules/refractor/lang/log.js","./lang/lolcode.js":"../node_modules/refractor/lang/lolcode.js","./lang/lua.js":"../node_modules/refractor/lang/lua.js","./lang/magma.js":"../node_modules/refractor/lang/magma.js","./lang/makefile.js":"../node_modules/refractor/lang/makefile.js","./lang/markdown.js":"../node_modules/refractor/lang/markdown.js","./lang/markup-templating.js":"../node_modules/refractor/lang/markup-templating.js","./lang/matlab.js":"../node_modules/refractor/lang/matlab.js","./lang/maxscript.js":"../node_modules/refractor/lang/maxscript.js","./lang/mel.js":"../node_modules/refractor/lang/mel.js","./lang/mermaid.js":"../node_modules/refractor/lang/mermaid.js","./lang/mizar.js":"../node_modules/refractor/lang/mizar.js","./lang/mongodb.js":"../node_modules/refractor/lang/mongodb.js","./lang/monkey.js":"../node_modules/refractor/lang/monkey.js","./lang/moonscript.js":"../node_modules/refractor/lang/moonscript.js","./lang/n1ql.js":"../node_modules/refractor/lang/n1ql.js","./lang/n4js.js":"../node_modules/refractor/lang/n4js.js","./lang/nand2tetris-hdl.js":"../node_modules/refractor/lang/nand2tetris-hdl.js","./lang/naniscript.js":"../node_modules/refractor/lang/naniscript.js","./lang/nasm.js":"../node_modules/refractor/lang/nasm.js","./lang/neon.js":"../node_modules/refractor/lang/neon.js","./lang/nevod.js":"../node_modules/refractor/lang/nevod.js","./lang/nginx.js":"../node_modules/refractor/lang/nginx.js","./lang/nim.js":"../node_modules/refractor/lang/nim.js","./lang/nix.js":"../node_modules/refractor/lang/nix.js","./lang/nsis.js":"../node_modules/refractor/lang/nsis.js","./lang/objectivec.js":"../node_modules/refractor/lang/objectivec.js","./lang/ocaml.js":"../node_modules/refractor/lang/ocaml.js","./lang/opencl.js":"../node_modules/refractor/lang/opencl.js","./lang/openqasm.js":"../node_modules/refractor/lang/openqasm.js","./lang/oz.js":"../node_modules/refractor/lang/oz.js","./lang/parigp.js":"../node_modules/refractor/lang/parigp.js","./lang/parser.js":"../node_modules/refractor/lang/parser.js","./lang/pascal.js":"../node_modules/refractor/lang/pascal.js","./lang/pascaligo.js":"../node_modules/refractor/lang/pascaligo.js","./lang/pcaxis.js":"../node_modules/refractor/lang/pcaxis.js","./lang/peoplecode.js":"../node_modules/refractor/lang/peoplecode.js","./lang/perl.js":"../node_modules/refractor/lang/perl.js","./lang/php-extras.js":"../node_modules/refractor/lang/php-extras.js","./lang/php.js":"../node_modules/refractor/lang/php.js","./lang/phpdoc.js":"../node_modules/refractor/lang/phpdoc.js","./lang/plsql.js":"../node_modules/refractor/lang/plsql.js","./lang/powerquery.js":"../node_modules/refractor/lang/powerquery.js","./lang/powershell.js":"../node_modules/refractor/lang/powershell.js","./lang/processing.js":"../node_modules/refractor/lang/processing.js","./lang/prolog.js":"../node_modules/refractor/lang/prolog.js","./lang/promql.js":"../node_modules/refractor/lang/promql.js","./lang/properties.js":"../node_modules/refractor/lang/properties.js","./lang/protobuf.js":"../node_modules/refractor/lang/protobuf.js","./lang/psl.js":"../node_modules/refractor/lang/psl.js","./lang/pug.js":"../node_modules/refractor/lang/pug.js","./lang/puppet.js":"../node_modules/refractor/lang/puppet.js","./lang/pure.js":"../node_modules/refractor/lang/pure.js","./lang/purebasic.js":"../node_modules/refractor/lang/purebasic.js","./lang/purescript.js":"../node_modules/refractor/lang/purescript.js","./lang/python.js":"../node_modules/refractor/lang/python.js","./lang/q.js":"../node_modules/refractor/lang/q.js","./lang/qml.js":"../node_modules/refractor/lang/qml.js","./lang/qore.js":"../node_modules/refractor/lang/qore.js","./lang/qsharp.js":"../node_modules/refractor/lang/qsharp.js","./lang/r.js":"../node_modules/refractor/lang/r.js","./lang/racket.js":"../node_modules/refractor/lang/racket.js","./lang/reason.js":"../node_modules/refractor/lang/reason.js","./lang/regex.js":"../node_modules/refractor/lang/regex.js","./lang/rego.js":"../node_modules/refractor/lang/rego.js","./lang/renpy.js":"../node_modules/refractor/lang/renpy.js","./lang/rest.js":"../node_modules/refractor/lang/rest.js","./lang/rip.js":"../node_modules/refractor/lang/rip.js","./lang/roboconf.js":"../node_modules/refractor/lang/roboconf.js","./lang/robotframework.js":"../node_modules/refractor/lang/robotframework.js","./lang/ruby.js":"../node_modules/refractor/lang/ruby.js","./lang/rust.js":"../node_modules/refractor/lang/rust.js","./lang/sas.js":"../node_modules/refractor/lang/sas.js","./lang/sass.js":"../node_modules/refractor/lang/sass.js","./lang/scala.js":"../node_modules/refractor/lang/scala.js","./lang/scheme.js":"../node_modules/refractor/lang/scheme.js","./lang/scss.js":"../node_modules/refractor/lang/scss.js","./lang/shell-session.js":"../node_modules/refractor/lang/shell-session.js","./lang/smali.js":"../node_modules/refractor/lang/smali.js","./lang/smalltalk.js":"../node_modules/refractor/lang/smalltalk.js","./lang/smarty.js":"../node_modules/refractor/lang/smarty.js","./lang/sml.js":"../node_modules/refractor/lang/sml.js","./lang/solidity.js":"../node_modules/refractor/lang/solidity.js","./lang/solution-file.js":"../node_modules/refractor/lang/solution-file.js","./lang/soy.js":"../node_modules/refractor/lang/soy.js","./lang/sparql.js":"../node_modules/refractor/lang/sparql.js","./lang/splunk-spl.js":"../node_modules/refractor/lang/splunk-spl.js","./lang/sqf.js":"../node_modules/refractor/lang/sqf.js","./lang/sql.js":"../node_modules/refractor/lang/sql.js","./lang/squirrel.js":"../node_modules/refractor/lang/squirrel.js","./lang/stan.js":"../node_modules/refractor/lang/stan.js","./lang/stylus.js":"../node_modules/refractor/lang/stylus.js","./lang/swift.js":"../node_modules/refractor/lang/swift.js","./lang/systemd.js":"../node_modules/refractor/lang/systemd.js","./lang/t4-cs.js":"../node_modules/refractor/lang/t4-cs.js","./lang/t4-templating.js":"../node_modules/refractor/lang/t4-templating.js","./lang/t4-vb.js":"../node_modules/refractor/lang/t4-vb.js","./lang/tap.js":"../node_modules/refractor/lang/tap.js","./lang/tcl.js":"../node_modules/refractor/lang/tcl.js","./lang/textile.js":"../node_modules/refractor/lang/textile.js","./lang/toml.js":"../node_modules/refractor/lang/toml.js","./lang/tsx.js":"../node_modules/refractor/lang/tsx.js","./lang/tt2.js":"../node_modules/refractor/lang/tt2.js","./lang/turtle.js":"../node_modules/refractor/lang/turtle.js","./lang/twig.js":"../node_modules/refractor/lang/twig.js","./lang/typescript.js":"../node_modules/refractor/lang/typescript.js","./lang/typoscript.js":"../node_modules/refractor/lang/typoscript.js","./lang/unrealscript.js":"../node_modules/refractor/lang/unrealscript.js","./lang/uri.js":"../node_modules/refractor/lang/uri.js","./lang/v.js":"../node_modules/refractor/lang/v.js","./lang/vala.js":"../node_modules/refractor/lang/vala.js","./lang/vbnet.js":"../node_modules/refractor/lang/vbnet.js","./lang/velocity.js":"../node_modules/refractor/lang/velocity.js","./lang/verilog.js":"../node_modules/refractor/lang/verilog.js","./lang/vhdl.js":"../node_modules/refractor/lang/vhdl.js","./lang/vim.js":"../node_modules/refractor/lang/vim.js","./lang/visual-basic.js":"../node_modules/refractor/lang/visual-basic.js","./lang/warpscript.js":"../node_modules/refractor/lang/warpscript.js","./lang/wasm.js":"../node_modules/refractor/lang/wasm.js","./lang/wiki.js":"../node_modules/refractor/lang/wiki.js","./lang/wolfram.js":"../node_modules/refractor/lang/wolfram.js","./lang/wren.js":"../node_modules/refractor/lang/wren.js","./lang/xeora.js":"../node_modules/refractor/lang/xeora.js","./lang/xml-doc.js":"../node_modules/refractor/lang/xml-doc.js","./lang/xojo.js":"../node_modules/refractor/lang/xojo.js","./lang/xquery.js":"../node_modules/refractor/lang/xquery.js","./lang/yaml.js":"../node_modules/refractor/lang/yaml.js","./lang/yang.js":"../node_modules/refractor/lang/yang.js","./lang/zig.js":"../node_modules/refractor/lang/zig.js"}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "36249" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js"], null)
//# sourceMappingURL=/refractor.5c664bab.js.map