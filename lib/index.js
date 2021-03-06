// Generated by CoffeeScript 2.0.0-beta4
void function () {
  var badRequireError, bundle, canonicalise, CJS_DIR, cjsify, CoffeeScript, CORE_MODULES, esprima, estraverse, fs, isCore, md5, mod, NODE_CORE_MODULES, path, PRELUDE, PRELUDE_NODE, relativeResolve, resolve, resolvePath, traverseDependencies, wrapFile;
  path = require('path');
  fs = require('fs');
  resolve = require('resolve');
  esprima = require('esprima');
  estraverse = require('estraverse');
  CoffeeScript = require('coffee-script-redux');
  md5 = require('MD5');
  CJS_DIR = path.join(__dirname, '..');
  CORE_MODULES = {
    buffer: path.join(CJS_DIR, 'node_modules/buffer-browserify/index.js'),
    crypto: path.join(CJS_DIR, 'node_modules/crypto-browserify/index.js'),
    events: path.join(CJS_DIR, 'node_modules/events-browserify/events.js'),
    http: path.join(CJS_DIR, 'node_modules/http-browserify/index.js'),
    querystring: path.join(CJS_DIR, 'node_modules/querystring/index.js'),
    vm: path.join(CJS_DIR, 'node_modules/vm-browserify/index.js'),
    zlib: path.join(CJS_DIR, 'node_modules/zlib-browserify/index.js')
  };
  NODE_CORE_MODULES = [
    '_stream_duplex.js',
    '_stream_passthrough.js',
    '_stream_readable.js',
    '_stream_transform.js',
    '_stream_writable.js',
    'assert',
    'console',
    'domain',
    'freelist',
    'path',
    'punycode',
    'readline',
    'stream',
    'string_decoder',
    'sys',
    'url',
    'util'
  ];
  for (var i$ = 0, length$ = NODE_CORE_MODULES.length; i$ < length$; ++i$) {
    mod = NODE_CORE_MODULES[i$];
    CORE_MODULES[mod] = path.join(CJS_DIR, 'node/lib/' + mod + '.js');
  }
  isCore = function (x) {
    return resolve.isCore(x) || [].hasOwnProperty.call(CORE_MODULES, x);
  };
  PRELUDE_NODE = "\nvar process = function(){\n  var cwd = '/';\n  return {\n    title: 'browser',\n    version: '" + process.version + "',\n    browser: true,\n    env: {},\n    argv: [],\n    nextTick: global.setImmediate || function(fn){ setTimeout(fn, 0); },\n    cwd: function(){ return cwd; },\n    chdir: function(dir){ cwd = dir; }\n  };\n}();";
  PRELUDE = "\nfunction require(file, parentModule){\n  if({}.hasOwnProperty.call(require.cache, file))\n    return require.cache[file];\n\n  var resolved = require.resolve(file);\n  if(!resolved) throw new Error('Failed to resolve module ' + file);\n\n  var module$ = {\n    id: file,\n    require: require,\n    filename: file,\n    exports: {},\n    loaded: false,\n    parent: parentModule,\n    children: []\n  };\n  if(parentModule) parentModule.children.push(module$);\n  var dirname = file.slice(0, file.lastIndexOf('/') + 1);\n\n  require.cache[file] = module$.exports;\n  resolved.call(module$.exports, module$, module$.exports, dirname, file);\n  module$.loaded = true;\n  return require.cache[file] = module$.exports;\n}\n\nrequire.modules = {};\nrequire.cache = {};\n\nrequire.resolve = function(file){\n  return {}.hasOwnProperty.call(require.modules, file) ? require.modules[file] : void 0;\n};\nrequire.define = function(file, fn){ require.modules[file] = fn; };";
  wrapFile = function (name, program) {
    var wrapper, wrapperProgram;
    wrapperProgram = esprima.parse('require.define(0, function(module, exports, __dirname, __filename){});');
    wrapper = wrapperProgram.body[0];
    wrapper.expression['arguments'][0] = {
      type: 'Literal',
      value: name
    };
    wrapper.expression['arguments'][1].body.body = program.body;
    return wrapper;
  };
  bundle = function (processed, entryPoint, root, options) {
    var ast, exportExpression, filename, iife, lhsExpression, prelude, program, requireEntryPoint;
    prelude = (null != options.node ? options.node : true) ? '' + PRELUDE + '\n' + PRELUDE_NODE : PRELUDE;
    program = esprima.parse(prelude);
    for (filename in processed) {
      if (!isOwn$(processed, filename))
        continue;
      ast = processed[filename];
      program.body.push(wrapFile(ast.loc.source, ast));
    }
    requireEntryPoint = {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: 'require'
      },
      'arguments': [{
          type: 'Literal',
          value: canonicalise(root, entryPoint)
        }]
    };
    if (null != options['export']) {
      exportExpression = esprima.parse(options['export']).body[0].expression;
      lhsExpression = exportExpression.type === 'Identifier' ? {
        type: 'MemberExpression',
        computed: false,
        object: {
          type: 'Identifier',
          name: 'global'
        },
        property: {
          type: 'Identifier',
          name: exportExpression.name
        }
      } : exportExpression;
      program.body.push({
        type: 'ExpressionStatement',
        expression: {
          type: 'AssignmentExpression',
          operator: '=',
          left: lhsExpression,
          right: requireEntryPoint
        }
      });
    } else {
      program.body.push({
        type: 'ExpressionStatement',
        expression: requireEntryPoint
      });
    }
    iife = esprima.parse('(function(global){}).call(this, this);');
    iife.body[0].expression.callee.object.body.body = program.body;
    iife.leadingComments = [{
        type: 'Line',
        value: ' Generated by CommonJS Everywhere ' + require(path.join(CJS_DIR, 'package.json')).version
      }];
    return iife;
  };
  badRequireError = function (filename, node, msg) {
    if (null != node.loc && null != (null != node.loc ? node.loc.start : void 0))
      filename = '' + filename + ':' + node.loc.start.line + ':' + node.loc.start.column;
    throw 'illegal require: ' + msg + '\n  `' + require('escodegen').generate(node) + '`\n  in ' + filename + '';
  };
  canonicalise = function (root, file) {
    return '/' + path.relative(root, file);
  };
  resolvePath = function (extensions, root, givenPath, cwd) {
    var corePath, e;
    if (isCore(givenPath)) {
      corePath = CORE_MODULES[givenPath];
      if (!fs.existsSync(corePath))
        throw new Error('Core module "' + givenPath + '" has not yet been ported to the browser');
      givenPath = corePath;
    }
    try {
      return resolve.sync(givenPath, {
        basedir: cwd || root,
        extensions: extensions
      });
    } catch (e$) {
      e = e$;
      try {
        return resolve.sync(path.join(root, givenPath), { extensions: extensions });
      } catch (e$1) {
        e = e$1;
        throw new Error('Cannot find module "' + givenPath + '" in "' + root + '"');
      }
    }
  };
  relativeResolve = function (extensions, root, givenPath, cwd) {
    var resolved;
    resolved = resolvePath(extensions, root, givenPath, cwd);
    if (isCore(givenPath)) {
      return givenPath;
    } else {
      return canonicalise(root, resolved);
    }
  };
  traverseDependencies = function (entryPoint, root, options) {
    var aliases, ast, cache$, cache$1, canonicalName, digest, ext, extensions, extname, fileContents, filename, handler, handlers, processed, worklist;
    if (null == root)
      root = process.cwd();
    if (null == options)
      options = {};
    aliases = null != options.aliases ? options.aliases : {};
    handlers = {
      '.coffee': function (coffee, canonicalName) {
        return CoffeeScript.compile(CoffeeScript.parse(coffee, { raw: true }), { bare: true });
      },
      '.json': function (json, canonicalName) {
        return esprima.parse('module.exports = ' + json, {
          loc: true,
          source: canonicalName
        });
      }
    };
    for (ext in cache$ = null != options.handlers ? options.handlers : {}) {
      if (!isOwn$(cache$, ext))
        continue;
      handler = cache$[ext];
      handlers[ext] = handler;
    }
    extensions = ['.js'].concat([].slice.call(function (accum$) {
      for (ext in handlers) {
        if (!isOwn$(handlers, ext))
          continue;
        accum$.push(ext);
      }
      return accum$;
    }.call(this, [])));
    worklist = [{
        filename: path.resolve(entryPoint),
        canonicalName: canonicalise(root, entryPoint)
      }];
    processed = {};
    while (worklist.length) {
      cache$1 = worklist.pop();
      filename = cache$1.filename;
      canonicalName = cache$1.canonicalName;
      if ({}.hasOwnProperty.call(processed, filename))
        continue;
      if ({}.hasOwnProperty.call(aliases, canonicalName))
        filename = resolvePath(extensions, root, aliases[canonicalName]);
      extname = path.extname(filename);
      fileContents = fs.readFileSync(filename).toString();
      if (options.cache) {
        digest = md5(fileContents.toString());
        if (options.cache[filename] === digest)
          continue;
        options.cache[filename] = digest;
      }
      processed[filename] = ast = {}.hasOwnProperty.call(handlers, extname) ? handlers[extname](fileContents, canonicalName) : function () {
        var e;
        try {
          return esprima.parse(fileContents, {
            loc: true,
            source: canonicalName
          });
        } catch (e$) {
          e = e$;
          throw new Error('Syntax error in ' + filename + ' at line ' + e.lineNumber + ', column ' + e.column + e.message.slice(e.message.indexOf(':')));
        }
      }.call(this);
      if (null != ast.loc)
        ast.loc;
      else
        ast.loc = {};
      estraverse.replace(ast, {
        enter: function (node, parents) {
          var cwd, e, targetCanonicalName;
          if (null != node.loc)
            node.loc.source = canonicalName;
          if (!(node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'require'))
            return;
          if (!(node['arguments'].length === 1))
            badRequireError(filename, node, 'require must be given exactly one argument');
          if (!(node['arguments'][0].type === 'Literal' && typeof node['arguments'][0].value === 'string'))
            badRequireError(filename, node, 'argument of require must be a constant string');
          cwd = path.dirname(fs.realpathSync(filename));
          if (options.verbose)
            console.error('required "' + node['arguments'][0].value + '" from "' + canonicalName + '"');
          try {
            targetCanonicalName = relativeResolve(extensions, root, node['arguments'][0].value, cwd);
            worklist.push({
              filename: resolvePath(extensions, root, node['arguments'][0].value, cwd),
              canonicalName: targetCanonicalName
            });
          } catch (e$) {
            e = e$;
            if (options.ignoreMissing) {
              return {
                type: 'Literal',
                value: null
              };
            } else {
              throw e;
            }
          }
          return {
            type: 'CallExpression',
            callee: node.callee,
            'arguments': [
              {
                type: 'Literal',
                value: targetCanonicalName
              },
              {
                type: 'Identifier',
                name: 'module'
              }
            ]
          };
        }
      });
    }
    return processed;
  };
  cjsify = function (entryPoint, root, options) {
    var processed;
    if (null == root)
      root = process.cwd();
    if (null == options)
      options = {};
    processed = traverseDependencies(entryPoint, root, options);
    if (options.verbose)
      console.error('\nIncluded modules:\n  ' + Object.keys(processed).sort().join('\n  '));
    return bundle(processed, entryPoint, root, options);
  };
  exports.bundle = bundle;
  exports.cjsify = cjsify;
  exports.traverseDependencies = traverseDependencies;
  if ('undefined' !== typeof IN_TESTING_ENVIRONMENT && null != IN_TESTING_ENVIRONMENT) {
    exports.badRequireError = badRequireError;
    exports.canonicalise = canonicalise;
    exports.isCore = isCore;
    exports.relativeResolve = relativeResolve;
    exports.resolvePath = resolvePath;
    exports.wrapFile = wrapFile;
  }
  function isOwn$(o, p) {
    return {}.hasOwnProperty.call(o, p);
  }
}.call(this);
