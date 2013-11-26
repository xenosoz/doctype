// doctype.js: xenosoz-flavored require.js
// original works from https://github.com/jrburke/requirejs/blob/master/require.js

var $doctype;
(function($global) {
  if (typeof $doctype !== 'undefined') {
    // Do not override the default setting.
    return;
  }

  var $contextMap = {};
  var $moduleMap = {};
  var nodeStack = [];

  function isArray(x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  }

  function toArray(x) {
    return Array.prototype.slice.call(x, 0);
  }

  function createNode(moduleName, url) {
    var node = document.createElement('script');
    node.type = 'text/javascript';
    node.charset = 'utf-8';
    node.async = true;

    node.setAttribute('data-doctypemodule', moduleName);
    node.src = url;
    return node;
  }

  function executeNode(node) {
    var promise = {
      then: function(onTrue, onFalse) {
        var cleanup = function(node) {
          node.removeEventListener('load');
          node.removeEventListener('error');
          nodeStack.unshift();
        };
        node.addEventListener('load', function() { cleanup(node); onTrue.apply(this, arguments); }, false);
        node.addEventListener('error', function() { cleanup(node); onFalse.apply(this, arguments); }, false);

        nodeStack.push(node);
        document.head.appendChild(node);
      },
    };
    return promise;
  }

  function load(url, callback) {
    var moduleName = url;  // XXX
    var node = createNode(moduleName, url);
    if ($contextMap[moduleName]) {
      callback && callback(this);
    }

    executeNode(node).then(function(event) {
      var node = event.currentTarget || event.srcElement;
      var contextName = node.getAttribute('data-doctypemodule');
      var context = $contextMap[contextName];

      // Scan for dependencies
      var fixiter = function(depKey) {
        if (depKey >= context.deps.length) {
          return done.call(this);
        }
        var dep = context.deps[depKey];
        load(dep[0], function() { fixiter(depKey+1) });
      };

      // Load for dependencies
      var done = function() {
        var $scope = {};
        for (var depKey in context.deps) {
          var dep = context.deps[depKey];
          var moduleSrc = dep[0];
          var module = $moduleMap[moduleSrc];

          var subFields = dep[1];
          var aliases = dep[2];
          if (!isArray(subFields)) { subFields = [subFields]; }
          if (!isArray(aliases)) { aliases = [aliases]; }

          for (var i = 0; i < aliases.length; ++i) {
            var value = subFields[i] ? module[subFields[i]] : module;
            var name = aliases[i] || dep[0];
            $scope[name] = value;
          }
        }
        var module = context.body.call(this, $scope);
        $moduleMap[moduleName] = module;

        callback && callback.call(this);
      }

      // Fire!
      fixiter(0);
    });
  }

  function Context(name) {
    var self = this;

    self.name = name;
    self.deps = [];
    self.body = null;

    self.import_ = function(moduleSrc) {
      if (!isArray(moduleSrc)) { moduleSrc = [moduleSrc]; }
      for (var mIdx in moduleSrc) {
        self.deps.push([moduleSrc[mIdx], null, null]);
      }
    };
    self.import_as_ = function(moduleSrc, moduleAlias) {
      if (!isArray(moduleSrc)) { moduleSrc = [moduleSrc]; }
      if (!isArray(moduleAlias)) { moduleAlias = [moduleAlias]; }
      var len = moduleSrc.length;
      if (len != moduleAlias.length) {
        throw "ValueError: arity mismatch on import " + moduleSrc + " as " + moduleAlias + " in " + self.name;
      }
      for (var i = 0; i < len; ++i) {
        self.deps.push([moduleSrc[i], null, moduleAlias[i]]);
      }
    };
    self.from_import_ = function(moduleSrc, fnName) {
      if (isArray(moduleSrc)) {
        throw "TypeError: " + moduleSrc + " cannot be an array for from_import_ in " + self.name;
      }
      if (!isArray(fnName)) { fnName = [fnName]; }
      for (var fnKey in fnName) {
        self.deps.push([moduleSrc, fnName[fnKey], null]);
      }
    };
    self.from_import_as_ = function(moduleSrc, fnName, fnAlias) {
      if (isArray(moduleSrc)) {
        throw "TypeError: " + moduleSrc + " cannot be an array for from_import_ in " + self.name;
      }
      if (!isArray(fnName)) { fnName = [fnName]; }
      if (!isArray(fnAlias)) { fnAlias = [fnAlias]; }
      var len = fnName.length;
      if (len != fnAlias.length) {
        throw "ValueError: arity mismatch on from " + moduleSrc + " import " + fnName + " as " + fnAlias + " in " + self.name;
      }
      self.deps.push([moduleSrc, fnName, fnAlias]);
    };
    self.define_ = function(body) {
      self.body = body;
    };

    return self;
  }

  function ContextBuilder(context) {
    var self = this;

    self.context = context;
    self.clear = function() {
      delete self.$import;
      delete self.$from;
      delete self.$as;
    };
    self.machine = {
      epsilon: {
        $import: function() { self.$import=toArray(arguments); return self.machine.$import; },
        $from: function(x) { self.$from=x; return self.machine.$from; },
        $define: function(x) { self.context.define_(x); self.clear(); return self.machine.$define; },
      },
      $import: {
        $import: function() { self.context.import_(self.$import); self.clear(); self.$import=toArray(arguments); return self.machine.$import; },
        $as: function() { self.$as=toArray(arguments); return self.machine.$import$as; },
        $from: function(x) { self.context.import_(self.$import); self.clear(); self.$from=x; return self.machine.$from; },
        $define: function(x) { self.context.import_(self.$import); self.clear(); self.context.define_(x); return self.machine.$define},
      },
      $import$as: {
        $import: function() { self.context.import_as_(self.$import, self.$as); self.clear(); self.$import=toArray(arguments); return self.machine.$import; },
        $from: function(x) { self.context.import_as_(self.$import, self.$as); self.clear(); self.$from=x; return self.machine.$from; },
        $define: function(x) { self.context.import_as_(self.$import, self.$as); self.clear(); self.context.define_(x); return self.machine.$define; },
      },
      $from: {
        $import: function() { self.$import=toArray(arguments); return self.machine.$from$import; },
      },
      $from$import: {
        $import: function() { self.context.from_import_(self.$from, self.$import); self.clear(); self.$import=toArray(arguments); return self.machine.$import; },
        $as: function() { self.$as=toArray(arguments); return self.machine.$from$import$as; },
        $from: function(x) { self.context.from_import_(self.$from, self.$import); self.clear(); self.$from=x; return self.machine.$from; },
        $define: function(x) { self.context.from_import_(self.$from, self.$import); self.clear(); self.context.define_(x); return self.machine.$define; },
      },
      $from$import$as: {
        $import: function() { self.from_import_as_(self.$from, self.$import, self.$as); self.clear(); $self.$import=toArray(arguments); return self.machine.$import; },
        $from: function(x) { self.from_import_as_(self.$from, self.$import, self.$as); self.clear(); $self.$from=x; return self.machine.$from; },
        $define: function(x) { self.from_import_as_(self.$from, self.$import, self.$as); self.clear(); self.context.define_(x); return self.machine.$define; },
      },
      $define: {
      },
    };
    return self.machine.epsilon;
  }

  $doctype = function(doctype) {
    var node = nodeStack[nodeStack.length - 1];
    var contextName = node.getAttribute('data-doctypemodule');
    var context = new Context(contextName);
    $contextMap[contextName] = context;

    return new ContextBuilder(context);
  }

  var mainScript;
  var scripts = toArray(document.getElementsByTagName('script'));
  for (var sIdx in scripts) {
    var script = scripts[sIdx];
    var dataMain = script.getAttribute('data-main');
    if (dataMain) { mainScript = dataMain; }
  }

  load(mainScript, function() {
    //console.log($contextMap);
    //console.log($moduleMap);
  });

})(this);
