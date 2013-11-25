// doctype.js: xenosoz-flavored require.js
// original works from https://github.com/jrburke/requirejs/blob/master/require.js

var $doctype;
(function($global) {
  if (typeof $doctype !== 'undefined') {
    // Do not override the default setting.
    return;
  }

  var $moduleMap = {};
  var nodeStack = [];

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

        console.log("CAS::set" + node.src);

        nodeStack.push(node);
        document.head.appendChild(node);
      },
    };
    return promise;
  }

  function load(moduleName, url) {
    var node = createNode(moduleName, url);

    executeNode(node).then(function(event) {
      var node = event.currentTarget || event.srcElement;
    });
  }

  function Context(contextName) {
    var self = this;
    self.$contextName = contextName;
    self.$scope = {};

    self.$import = function(moduleName) {
      load(moduleName, moduleName);
      self.$scope[moduleName] = $moduleMap[moduleName];
      return self;
    };
    self.$define = function(mainFn) {
      $moduleMap[contextName] = mainFn.call(this, self.$scope);
      console.log($moduleMap);
      return self;
    };
  };

  $doctype = function(doctype) {
    var node = nodeStack[nodeStack.length - 1];
    console.log("CAS: " + node.src);
    var contextName = node.getAttribute('data-doctypemodule');
    return new Context(contextName);
  }

  load('main', 'example/main.js');

})(this);
