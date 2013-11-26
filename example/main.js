// $doctype('-*- javascript -*-')
//   .$import('sys')  // $scope.sys
//   .$import('SimpleHttpServer').$as('hs') // $scope.hs
//   .$from('math').$import('log')  // $scope.log
//   .$from('math').$import('pow').$as('p')  // $scope.p
//   .$define(function() { ... })
// ;

$doctype('-*- javascript -*-')
  .$from('example/widget.js').$import('*')
  .$import('example/alpha.js', 'example/beta.js').$as('alpha', 'beta')
  .$define(function($scope) {
    console.log("Main::init();");

    w = new $scope.Widget();

    $scope.greet()  // from example/widget.js
    console.log($scope);

    return 42;
  });
