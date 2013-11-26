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
          console.log("CAS::clear " + node.src);
        };
        node.addEventListener('load', function() { cleanup(node); onTrue.apply(this, arguments); }, false);
        node.addEventListener('error', function() { cleanup(node); onFalse.apply(this, arguments); }, false);

        console.log("CAS::set " + node.src);

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

          var value = dep[1] ? module[dep[1]] : module;
          var name = dep[2] || dep[0];
          $scope[name] = value;
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
      self.deps.push([moduleSrc, null, null]);
    };
    self.import_as_ = function(moduleSrc, moduleAlias) {
      self.deps.push([moduleSrc, null, moduleAlias]);
    };
    self.from_import_ = function(moduleSrc, fnName) {
      self.deps.push([moduleSrc, fnName, null]);
    };
    self.from_import_as_ = function(moduleSrc, fnName, fnAlias) {
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
        $import: function(x) { self.$import=x; return self.machine.$import; },
        $from: function(x) { self.$from=x; return self.machine.$from; },
        $define: function(x) { self.context.define_(x); self.clear(); return self.machine.$define; },
      },
      $import: {
        $import: function(x) { self.context.import_(self.$import); self.clear(); self.$import=x; return self.machine.$import; },
        $as: function(x) { self.$as=x; return self.machine.$import$as; },
        $from: function(x) { self.context.import_(self.$import); self.clear(); self.$from=x; return self.machine.$from; },
        $define: function(x) { self.context.import_(self.$import); self.clear(); self.context.define_(x); return self.machine.$define},
      },
      $import$as: {
        $import: function(x) { self.context.import_as_(self.$import, self.$as); self.clear(); self.$import=x; return self.machine.$import; },
        $from: function(x) { self.context.import_as_(self.$import, self.$as); self.clear(); self.$from=x; return self.machine.$from; },
        $define: function(x) { self.context.import_as_(self.$import, self.$as); self.clear(); self.context.define_(x); return self.machine.$define; },
      },
      $from: {
        $import: function(x) { self.$import=x; return self.machine.$from$import; },
      },
      $from$import: {
        $import: function(x) { self.context.from_import_(self.$from, self.$import); self.clear(); self.$import=x; return self.machine.$import; },
        $as: function(x) { self.$as=x; return self.machine.$from$import$as; },
        $from: function(x) { self.context.from_import_(self.$from, self.$import); self.clear(); self.$from=x; return self.machine.$from; },
        $define: function(x) { self.context.from_import_(self.$from, self.$import); self.clear(); self.context.define_(x); return self.machine.$define; },
      },
      $from$import$as: {
        $import: function(x) { self.from_import_as_(self.$from, self.$import, self.$as); self.clear(); $self.$import=x; return self.machine.$import; },
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
    console.log("CAS::get " + node.src);
    var contextName = node.getAttribute('data-doctypemodule');
    var context = new Context(contextName);
    $contextMap[contextName] = context;

    return new ContextBuilder(context);
  }

  load('example/main.js', function() {
    //console.log($contextMap);
    //console.log($moduleMap);
  });

  // XXX
  $global.$contextMap = $contextMap;
  $global.$moduleMap = $moduleMap;

})(this);
