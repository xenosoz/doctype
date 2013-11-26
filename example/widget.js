$doctype('-*- javascript -*-')
  .$define(function($scope) {
    var self = {};
    console.log("Widget::init();");

    function Widget() {
    }
    self.greet = function() { console.log('Hello, world!'); };
    self.value = 42;
    self.Widget = Widget;

    return self;
  });
