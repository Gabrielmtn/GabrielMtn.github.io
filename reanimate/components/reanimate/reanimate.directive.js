(function () {
  'use strict';

  // normally I would set the module in its own file, but since in this scenario I am only creating the single directive, I think it should be fine
  angular.module('app', []);

  angular
    .module('app')
    .directive('reanimate', reanimate);

    function reanimate() {
      return {
        restrict: 'E',
        templateUrl: 'components/reanimate/reanimate.html',
        controller: ReanimateController,
        controllerAs: 'vm'
      };
    }

    ReanimateController.$inject=['$timeout'];

    function ReanimateController($timeout) {
      var _self = this;
      _self.animating = false;
      _self.bezier = "easeInCubic";
      _self.animation = "bounceInSmall";
      _self.duration = "1000";
      _self.showAnimation = "";
      _self.toggleAnimation = toggleAnimation;

      _self.times = [
        {id: 100, name: '0.1 Seconds'},
        {id: 200, name: '0.2 Seconds'},
        {id: 300, name: '0.3 Seconds'},
        {id: 400, name: '0.4 Seconds'},
        {id: 500, name: '0.5 Seconds'},
        {id: 600, name: '0.6 Seconds'},
        {id: 700, name: '0.7 Seconds'},
        {id: 800, name: '0.8 Seconds'},
        {id: 900, name: '0.9 Seconds'},
        {id: 1000, name: '1.0 Second'},
        {id: 1200, name: '1.2 Seconds'},
        {id: 1400, name: '1.4 Seconds'},
        {id: 1600, name: '1.6 Seconds'},
        {id: 1800, name: '1.8 Seconds'},
        {id: 2000, name: '2.0 Seconds'},
        {id: 2500, name: '2.5 Seconds'},
        {id: 3000, name: '3.0 Seconds'},
        {id: 3500, name: '3.5 Seconds'},
        {id: 4000, name: '4.0 Seconds'},
      ];

      activate();

      //////////////

      function activate() {
        return toggleAnimation();
      }

      function toggleAnimation() {
        if (_self.animating)
          return;

        _self.animating = true;
        _self.showAnimation = _self.animation + " animated-" + _self.duration + " " + _self.bezier;

        $timeout(function() {
          _self.showAnimation = "";

          _self.animating = false;
        }, _self.duration);
      }
    }

})();
