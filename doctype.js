// doctype.js: xenosoz-flavored require.js
// original works from https://github.com/jrburke/requirejs/blob/master/require.js

var $doctype;
(function($global) {
  if (typeof $doctype !== 'undefined') {
    // Do not override the default setting.
    return;
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
        };
        node.addEventListener('load', function() { cleanup(node); onTrue.apply(this, arguments); }, false);
        node.addEventListener('error', function() { cleanup(node); onFalse.apply(this, arguments); }, false);
        document.head.appendChild(node);
      },
    };
    return promise;
  }

  function Context() {
    var self = this;
    self.$scope = {};

    self.$import = function(moduleName) {
      console.log('import ' + moduleName);
      return $context;
    };
    self.$define = function(mainFn) {
      $modules = mainFn.call(this, self.$scope);
      return $context;
    };
  };
  var $context = new Context();

  $doctype = function(doctype) {
    return $context;
  }

  //
  var $modules = {};
  function load(moduleName, url) {
    var node = createNode(moduleName, url);

    executeNode(node).then(function(event) {
      var node = event.currentTarget || event.srcElement;
      console.log(node.getAttribute('data-doctypemodule'));
    });
  }

  load('main', 'example/main.js');

})(this);
