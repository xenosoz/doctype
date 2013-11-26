// $doctype('-*- javascript -*-')
//   .$import('sys')  // $scope.sys
//   .$import('SimpleHttpServer').$as('hs') // $scope.hs
//   .$from('math').$import('log')  // $scope.log
//   .$from('math').$import('pow').$as('p')  // $scope.p
//   .$define(function() { ... })
// ;

$doctype('-*- javascript -*-')
  .$import('example/widget.js').$as('Widget')
  .$define(function($scope) {
    w = new $scope.Widget();
    console.log("Main::init();");
    console.log($scope);
    return 42;
  });
