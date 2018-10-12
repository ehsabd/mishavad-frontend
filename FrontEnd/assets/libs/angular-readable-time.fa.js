(function () {
    'use strict';
    angular.module('readableTimeFa', []).filter('readableTimeFa', function () {
        return function (seconds) {
            var day, format, hour, minute, month, week, year;
            seconds = parseInt(seconds, 10);
            minute = 60;
            hour = minute * 60;
            day = hour * 24;
            week = day * 7;
            year = day * 365;
            month = year / 12;
            format = function (number, string) {
                return "" + number + " " + string;
            };
            switch (false) {
                case !(seconds < minute):
                    return format(seconds, 'ثانیه');
                case !(seconds < hour):
                    return format(Math.floor(seconds / minute), 'دقیقه');
                case !(seconds < day):
                    return format(Math.floor(seconds / hour), 'ساعت');
                case !(seconds < week):
                    return format(Math.floor(seconds / day), 'زور');
                case !(seconds < month):
                    return format(Math.floor(seconds / week), 'هفته');
                case !(seconds < year):
                    return format(Math.floor(seconds / month), 'ماه');
                default:
                    return format(Math.floor(seconds / year), 'سال');
            }
        };
    });

}).call(this);
