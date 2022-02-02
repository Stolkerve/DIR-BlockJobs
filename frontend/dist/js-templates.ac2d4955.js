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
})({"../node_modules/refractor/lang/js-templates.js":[function(require,module,exports) {
'use strict'

module.exports = jsTemplates
jsTemplates.displayName = 'jsTemplates'
jsTemplates.aliases = []
function jsTemplates(Prism) {
  ;(function (Prism) {
    var templateString = Prism.languages.javascript['template-string'] // see the pattern in prism-javascript.js
    var templateLiteralPattern = templateString.pattern.source
    var interpolationObject = templateString.inside['interpolation']
    var interpolationPunctuationObject =
      interpolationObject.inside['interpolation-punctuation']
    var interpolationPattern = interpolationObject.pattern.source
    /**
     * Creates a new pattern to match a template string with a special tag.
     *
     * This will return `undefined` if there is no grammar with the given language id.
     *
     * @param {string} language The language id of the embedded language. E.g. `markdown`.
     * @param {string} tag The regex pattern to match the tag.
     * @returns {object | undefined}
     * @example
     * createTemplate('css', /\bcss/.source);
     */
    function createTemplate(language, tag) {
      if (!Prism.languages[language]) {
        return undefined
      }
      return {
        pattern: RegExp('((?:' + tag + ')\\s*)' + templateLiteralPattern),
        lookbehind: true,
        greedy: true,
        inside: {
          'template-punctuation': {
            pattern: /^`|`$/,
            alias: 'string'
          },
          'embedded-code': {
            pattern: /[\s\S]+/,
            alias: language
          }
        }
      }
    }
    Prism.languages.javascript['template-string'] = [
      // styled-jsx:
      //   css`a { color: #25F; }`
      // styled-components:
      //   styled.h1`color: red;`
      createTemplate(
        'css',
        /\b(?:styled(?:\([^)]*\))?(?:\s*\.\s*\w+(?:\([^)]*\))*)*|css(?:\s*\.\s*(?:global|resolve))?|createGlobalStyle|keyframes)/
          .source
      ), // html`<p></p>`
      // div.innerHTML = `<p></p>`
      createTemplate('html', /\bhtml|\.\s*(?:inner|outer)HTML\s*\+?=/.source), // svg`<path fill="#fff" d="M55.37 ..."/>`
      createTemplate('svg', /\bsvg/.source), // md`# h1`, markdown`## h2`
      createTemplate('markdown', /\b(?:md|markdown)/.source), // gql`...`, graphql`...`, graphql.experimental`...`
      createTemplate(
        'graphql',
        /\b(?:gql|graphql(?:\s*\.\s*experimental)?)/.source
      ), // sql`...`
      createTemplate('sql', /\bsql/.source), // vanilla template string
      templateString
    ].filter(Boolean)
    /**
     * Returns a specific placeholder literal for the given language.
     *
     * @param {number} counter
     * @param {string} language
     * @returns {string}
     */
    function getPlaceholder(counter, language) {
      return '___' + language.toUpperCase() + '_' + counter + '___'
    }
    /**
     * Returns the tokens of `Prism.tokenize` but also runs the `before-tokenize` and `after-tokenize` hooks.
     *
     * @param {string} code
     * @param {any} grammar
     * @param {string} language
     * @returns {(string|Token)[]}
     */
    function tokenizeWithHooks(code, grammar, language) {
      var env = {
        code: code,
        grammar: grammar,
        language: language
      }
      Prism.hooks.run('before-tokenize', env)
      env.tokens = Prism.tokenize(env.code, env.grammar)
      Prism.hooks.run('after-tokenize', env)
      return env.tokens
    }
    /**
     * Returns the token of the given JavaScript interpolation expression.
     *
     * @param {string} expression The code of the expression. E.g. `"${42}"`
     * @returns {Token}
     */
    function tokenizeInterpolationExpression(expression) {
      var tempGrammar = {}
      tempGrammar['interpolation-punctuation'] = interpolationPunctuationObject
      /** @type {Array} */
      var tokens = Prism.tokenize(expression, tempGrammar)
      if (tokens.length === 3) {
        /**
         * The token array will look like this
         * [
         *     ["interpolation-punctuation", "${"]
         *     "..." // JavaScript expression of the interpolation
         *     ["interpolation-punctuation", "}"]
         * ]
         */
        var args = [1, 1]
        args.push.apply(
          args,
          tokenizeWithHooks(tokens[1], Prism.languages.javascript, 'javascript')
        )
        tokens.splice.apply(tokens, args)
      }
      return new Prism.Token(
        'interpolation',
        tokens,
        interpolationObject.alias,
        expression
      )
    }
    /**
     * Tokenizes the given code with support for JavaScript interpolation expressions mixed in.
     *
     * This function has 3 phases:
     *
     * 1. Replace all JavaScript interpolation expression with a placeholder.
     *    The placeholder will have the syntax of a identify of the target language.
     * 2. Tokenize the code with placeholders.
     * 3. Tokenize the interpolation expressions and re-insert them into the tokenize code.
     *    The insertion only works if a placeholder hasn't been "ripped apart" meaning that the placeholder has been
     *    tokenized as two tokens by the grammar of the embedded language.
     *
     * @param {string} code
     * @param {object} grammar
     * @param {string} language
     * @returns {Token}
     */
    function tokenizeEmbedded(code, grammar, language) {
      // 1. First filter out all interpolations
      // because they might be escaped, we need a lookbehind, so we use Prism
      /** @type {(Token|string)[]} */
      var _tokens = Prism.tokenize(code, {
        interpolation: {
          pattern: RegExp(interpolationPattern),
          lookbehind: true
        }
      }) // replace all interpolations with a placeholder which is not in the code already
      var placeholderCounter = 0
      /** @type {Object<string, string>} */
      var placeholderMap = {}
      var embeddedCode = _tokens
        .map(function (token) {
          if (typeof token === 'string') {
            return token
          } else {
            var interpolationExpression = token.content
            var placeholder
            while (
              code.indexOf(
                (placeholder = getPlaceholder(placeholderCounter++, language))
              ) !== -1
            ) {
              /* noop */
            }
            placeholderMap[placeholder] = interpolationExpression
            return placeholder
          }
        })
        .join('') // 2. Tokenize the embedded code
      var embeddedTokens = tokenizeWithHooks(embeddedCode, grammar, language) // 3. Re-insert the interpolation
      var placeholders = Object.keys(placeholderMap)
      placeholderCounter = 0
      /**
       *
       * @param {(Token|string)[]} tokens
       * @returns {void}
       */
      function walkTokens(tokens) {
        for (var i = 0; i < tokens.length; i++) {
          if (placeholderCounter >= placeholders.length) {
            return
          }
          var token = tokens[i]
          if (typeof token === 'string' || typeof token.content === 'string') {
            var placeholder = placeholders[placeholderCounter]
            var s =
              typeof token === 'string'
                ? token
                : /** @type {string} */
                  token.content
            var index = s.indexOf(placeholder)
            if (index !== -1) {
              ++placeholderCounter
              var before = s.substring(0, index)
              var middle = tokenizeInterpolationExpression(
                placeholderMap[placeholder]
              )
              var after = s.substring(index + placeholder.length)
              var replacement = []
              if (before) {
                replacement.push(before)
              }
              replacement.push(middle)
              if (after) {
                var afterTokens = [after]
                walkTokens(afterTokens)
                replacement.push.apply(replacement, afterTokens)
              }
              if (typeof token === 'string') {
                tokens.splice.apply(tokens, [i, 1].concat(replacement))
                i += replacement.length - 1
              } else {
                token.content = replacement
              }
            }
          } else {
            var content = token.content
            if (Array.isArray(content)) {
              walkTokens(content)
            } else {
              walkTokens([content])
            }
          }
        }
      }
      walkTokens(embeddedTokens)
      return new Prism.Token(
        language,
        embeddedTokens,
        'language-' + language,
        code
      )
    }
    /**
     * The languages for which JS templating will handle tagged template literals.
     *
     * JS templating isn't active for only JavaScript but also related languages like TypeScript, JSX, and TSX.
     */
    var supportedLanguages = {
      javascript: true,
      js: true,
      typescript: true,
      ts: true,
      jsx: true,
      tsx: true
    }
    Prism.hooks.add('after-tokenize', function (env) {
      if (!(env.language in supportedLanguages)) {
        return
      }
      /**
       * Finds and tokenizes all template strings with an embedded languages.
       *
       * @param {(Token | string)[]} tokens
       * @returns {void}
       */
      function findTemplateStrings(tokens) {
        for (var i = 0, l = tokens.length; i < l; i++) {
          var token = tokens[i]
          if (typeof token === 'string') {
            continue
          }
          var content = token.content
          if (!Array.isArray(content)) {
            if (typeof content !== 'string') {
              findTemplateStrings([content])
            }
            continue
          }
          if (token.type === 'template-string') {
            /**
             * A JavaScript template-string token will look like this:
             *
             * ["template-string", [
             *     ["template-punctuation", "`"],
             *     (
             *         An array of "string" and "interpolation" tokens. This is the simple string case.
             *         or
             *         ["embedded-code", "..."] This is the token containing the embedded code.
             *                                  It also has an alias which is the language of the embedded code.
             *     ),
             *     ["template-punctuation", "`"]
             * ]]
             */
            var embedded = content[1]
            if (
              content.length === 3 &&
              typeof embedded !== 'string' &&
              embedded.type === 'embedded-code'
            ) {
              // get string content
              var code = stringContent(embedded)
              var alias = embedded.alias
              var language = Array.isArray(alias) ? alias[0] : alias
              var grammar = Prism.languages[language]
              if (!grammar) {
                // the embedded language isn't registered.
                continue
              }
              content[1] = tokenizeEmbedded(code, grammar, language)
            }
          } else {
            findTemplateStrings(content)
          }
        }
      }
      findTemplateStrings(env.tokens)
    })
    /**
     * Returns the string content of a token or token stream.
     *
     * @param {string | Token | (string | Token)[]} value
     * @returns {string}
     */
    function stringContent(value) {
      if (typeof value === 'string') {
        return value
      } else if (Array.isArray(value)) {
        return value.map(stringContent).join('')
      } else {
        return stringContent(value.content)
      }
    }
  })(Prism)
}

},{}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
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
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","../node_modules/refractor/lang/js-templates.js"], null)
//# sourceMappingURL=/js-templates.ac2d4955.js.map