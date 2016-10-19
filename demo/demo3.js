define(function(require) {
    require(['underscore'], function() {
        console.log(_);
        console.log(_.prototype);
    });
    require(['../DIY/2/_underscore'], function() {
        console.log(_);
        console.log(_.prototype);
    });
});
