$doctype('-*- javascript -*-')
  .$import('example/widget.js')
  .$define(function($scope) {
    console.log("Main::init();");
    console.log($scope.Widget);
  });
