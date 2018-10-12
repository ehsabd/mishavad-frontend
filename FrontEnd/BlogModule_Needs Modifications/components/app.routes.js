angular.module('app').config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $routeProvider
        .when('/about', {
            templateUrl: 'app/aboutView'
        })
        .when('/contact', {
            templateUrl: 'app/components/contact/contactView',
            controller:'ContactController'
        })
        .when('/blog', {
            reloadOnSearch: false,
            templateUrl: 'app/components/blog/blogView',
            controller: 'BlogController'
        })
        .when('/blog/post/:postIdOrSlug', {
            templateUrl: 'app/components/blog/postView',
            controller: 'BlogPostController'
        })
        .when('/blog/post/addedit/:postIdOrSlug',{
            templateUrl:'app/components/blog/addEditPostView',
            controller:'AddEditBlogPostController'
        })
        .when('/blog/login',{
            template:'',
            controller:function($scope){
                $scope.openLogin();
            }
        })
        .when('/', { redirectTo: '/blog' })
        .when('/home', { redirectTo: '/blog' });

    // use the HTML5 History API
    $locationProvider.html5Mode(true);

}]);
