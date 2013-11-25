// $doctype('-*- javascript -*-')
//   .$import('sys')  // $scope.sys
//   .$import('SimpleHttpServer').$as('hs') // $scope.hs
//   .$from('math').$import('log')  // $scope.log
//   .$from('math').$import('pow').$as('p')  // $scope.p
//   .$define(function() { ... })
// ;

$doctype('-*- javascript -*-')
  .$import('example/widget.js')
  .$define(function($scope) {
    console.log("Main::init();");

    console.log($scope['example/widget.js']);
    return 42;
  });
