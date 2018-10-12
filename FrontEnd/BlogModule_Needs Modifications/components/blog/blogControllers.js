    angular.module('app.blog', ['ngResource','ngWig', 'ngSanitize'])
        .controller('BlogController', ['$scope', 'blogPostResource', '$window','$timeout','postPagesResource', function ($scope, blogPostResource, $window, $timeout, postPagesResource) {

            $scope.$emit('TitleUpdatedEvent', 'خانه');
            $scope.$emit('DescriptionUpdatedEvent', 'پاندول روانشناسی علمی و کاربردی را به زبانی ساده به شما یاد می دهد. پاندول فقط یک نوسان');
            $scope.isLoading = true;
            $scope.postsPages=[];
            $scope.$watch('postsPages.length', function () {
                $scope.posts = [];
                if ($scope.postsPages.length == 0) {
                    return;
                }
               // console.log('$scope.postsPages.length: ' + $scope.postsPages.length);
                for (var i = 0; i < $scope.postsPages.length; i++) {
                    var page = $scope.postsPages[i];
                    $scope.posts = $scope.posts.concat(page.items);
                }
                for (var i = 0; i < $scope.posts.length; i++) {
                    $scope.posts[i].link = '/blog/post/' + $scope.posts[i].slug;
                }
                var lastPage = $scope.postsPages[$scope.postsPages.length - 1];
                $scope.nextPageLink = lastPage.nextPageLink;
                $scope.isLoading = false;

            });

            $scope.loadNextPage = function () {
                if ($scope.nextPageLink && !$scope.isLoading) {
                    $scope.isLoading = true;
                    var Post = postPagesResource($scope.nextPageLink);
                    var page = Post.get(function () {
                        $scope.postsPages.push(page);
                    });
                }
            };
            
            $timeout(function () {
                var Post = postPagesResource();
                var page = Post.get(function () {
                    $scope.postsPages.push(page);
                });
            }, 200);

        }])
        .controller('BlogPostController', ['$scope', '$routeParams', 'blogPostResource', function ($scope, $routeParams, blogPostResource) {
            
            function htmlToPlaintext(text) {
                return text ? String(text).replace(/<[^>]+>/gm, ' ') : '';
            }
            console.log(JSON.stringify($routeParams.postIdOrSlug));
            $scope.postIdorSlug = $routeParams.postIdOrSlug;
            $scope.postIdorSlug = $scope.postIdorSlug.replace(/(.*)\.html$/, '$1');
            $scope.post = blogPostResource().get({ id: $scope.postIdorSlug }, function () {
                $scope.post.tags=$scope.post.tags.split('|');
                $scope.$emit('TitleUpdatedEvent', $scope.post.title);
                $scope.$emit('DescriptionUpdatedEvent', String($scope.post.content).replace(/<[^>]+>/gm, ' ').substring(0, 160));
                console.log($scope.post);
            });
            var newestPosts = blogPostResource().query_newest(function () {

                for (var i = 0; i < newestPosts.length; i++) {
                    newestPosts[i].link = '/blog/post/' + newestPosts[i].slug;
                }

                $scope.docProps.pageMenu = {
                    title: 'تازه های پاندول',
                    items: newestPosts
                }
            });
        }])
        .controller('AddEditBlogPostController', ['$scope', '$routeParams', 'blogPostResource', function ($scope, $routeParams, blogPostResource) {
            console.log(JSON.stringify($routeParams.postIdOrSlug));
            $scope.postIdorSlug = $routeParams.postIdOrSlug;
        
            if ($scope.postIdorSlug=='new'){
                $scope.postInst = new (blogPostResource());
            }else{
                console.log($scope.access_token);
                $scope.postInst = blogPostResource($scope.access_token).get({ id: $scope.postIdorSlug }, function () {
                });
            }

            $scope.savePost = function(){
                $scope.postInst.$save();
            }

            $scope.onPaste = function (e, pasteContent) {
                //TODO fix this
                //TODO Convert MsoListParagraphCxSpFirst classes and similar to ol or ul tags
                
                pasteContent=pasteContent.replace(/<head>[\s\S]*?<\/head>/ig, '');
                pasteContent=pasteContent.replace(/style='[\s\S]*?'/ig, '');
                pasteContent=pasteContent.replace(/dir=[A-Z]*/ig, '');
                pasteContent=pasteContent.replace(/lang=[A-Z]*/ig, '');
                pasteContent=pasteContent.replace(/\s*>/g, '>');
                pasteContent=pasteContent.replace(/&nbsp;/gi,'');
                pasteContent=pasteContent.replace(/·/g, '');
                pasteContent=pasteContent.replace(/<span><span><span>([\s\S]*?)<\/span><\/span><\/span>/g, '$1');
                
                pasteContent=pasteContent.replace(/<p (class=MsoListParagraphCxSpFirst[\s\S]*?)<\/p>/ig, '<ul><li $1</li>');
                pasteContent=pasteContent.replace(/<p (class=MsoListParagraphCxSpMiddle[\s\S]*?)<\/p>/ig, '<li $1</li>');
                pasteContent=pasteContent.replace(/<p (class=MsoListParagraphCxSpLast[\s\S]*?)<\/p>/ig, '<li $1</li></ul>');
                pasteContent=pasteContent.replace(/<o:p><\/o:p>/g,'');
                console.log(pasteContent);
                return pasteContent;
            };
        
        }]);;