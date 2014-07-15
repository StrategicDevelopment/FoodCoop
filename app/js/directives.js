'use strict';
/*global angular, google, $, AddressFinder*/

/* Directives */


angular.module('co-op.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }])
	
  
  /**
   * A directive for adding google places autocomplete to a text box
   * google places autocomplete info: https://developers.google.com/maps/documentation/javascript/places
   *
   * Simple Usage:
   *
   * <input type="text" ng-autocomplete="result"/>
   *
   * creates the autocomplete text box and gives you access to the result
   *
   *   + `ng-autocomplete="result"`: specifies the directive, $scope.result will hold the textbox result
   *
   *
   * Advanced Usage:
   *
   * <input type="text" ng-autocomplete="result" details="details" options="options"/>
   *
   *   + `ng-autocomplete="result"`: specifies the directive, $scope.result will hold the textbox autocomplete result
   *
   *   + `details="details"`: $scope.details will hold the autocomplete's more detailed result; latlng. address components, etc.
   *
   *   + `options="options"`: options provided by the user that filter the autocomplete results
   *
   *      + options = {
   *           types: type,        string, values can be 'geocode', 'establishment', '(regions)', or '(cities)'
   *           bounds: bounds,     google maps LatLngBounds Object
   *           country: country    string, ISO 3166-1 Alpha-2 compatible country code. examples; 'ca', 'us', 'gb'
   *         }
   *
   *
   */
  .directive('ngAutocomplete', function($parse) {
      return {

        scope: {
          details: '=',
          ngAutocomplete: '=',
          options: '='
        },

        link: function(scope, element, attrs, model) {

          //options for autocomplete
          var opts;

          //convert options provided to opts
          var initOpts = function() {
            opts = {};
            if (scope.options) {
              if (scope.options.types) {
                opts.types = [];
                opts.types.push(scope.options.types);
              }
              if (scope.options.bounds) {
                opts.bounds = scope.options.bounds;
              }
              if (scope.options.country) {
                opts.componentRestrictions = {
                  country: scope.options.country
                };
              }
            }
          };
          initOpts();

          //create new autocomplete
          //reinitializes on every change of the options provided
          var newAutocomplete = function() {
            scope.gPlace = new google.maps.places.Autocomplete(element[0], opts);
            google.maps.event.addListener(scope.gPlace, 'place_changed', function() {
              scope.$apply(function() {
  //              if (scope.details) {
                  scope.details = scope.gPlace.getPlace();
  //              }
                scope.ngAutocomplete = element.val();
              });
            });
          };
          newAutocomplete();

          //watch options provided to directive
          scope.watchOptions = function () {
            return scope.options;
          };
          scope.$watch(scope.watchOptions, function () {
            initOpts();
            newAutocomplete();
            element[0].value = '';
            scope.ngAutocomplete = element.val();
          }, true);
        }
      };
    })
  
  
  .directive('checkStrength', function () {

    return {
        replace: false,
        restrict: 'EACM',
        link: function (scope, iElement, iAttrs) {

            var strength = {
                colors: ['#F00', '#F90', '#FF0', '#9F0', '#0F0'],
                mesureStrength: function (p) {

                    var _force = 0;                    
                    var _regex = /[$-/:-?{-~!/"^_`\[\]]/;
                                          
                    var _lowerLetters = /[a-z]+/.test(p);                    
                    var _upperLetters = /[A-Z]+/.test(p);
                    var _numbers = /[0-9]+/.test(p);
                    var _symbols = _regex.test(p);
                                          
                    var _flags = [_lowerLetters, _upperLetters, _numbers, _symbols];                    
                    var _passedMatches = $.grep(_flags, function (el) { return el === true; }).length;                                          
                    
                    _force += 2 * p.length + ((p.length >= 10) ? 1 : 0);
                    _force += _passedMatches * 10;
                        
                    // penalty (short password)
                    _force = (p.length <= 6) ? Math.min(_force, 10) : _force;                                      
                    
                    // penalty (poor variety of characters)
                    _force = (_passedMatches == 1) ? Math.min(_force, 10) : _force;
                    _force = (_passedMatches == 2) ? Math.min(_force, 20) : _force;
                    _force = (_passedMatches == 3) ? Math.min(_force, 40) : _force;
                    
                    return _force;

                },
                getColor: function (s) {

                    var idx = 0;
                    if (s <= 10) { idx = 0; }
                    else if (s <= 20) { idx = 1; }
                    else if (s <= 30) { idx = 2; }
                    else if (s <= 40) { idx = 3; }
                    else { idx = 4; }

                    return { idx: idx + 1, col: this.colors[idx] };

                }
            };

            scope.$watch(iAttrs.checkStrength, function () {
                if (scope.userData.password === '') {
                    iElement.css({ "display": "none"  });
                } else {
                    var c = strength.getColor(strength.mesureStrength(scope.userData.password));
                    iElement.css({ "display": "inline" });
                    iElement.children('li')
                        .css({ "background": "#DDD" })
                        .slice(0, c.idx)
                        .css({ "background": c.col });
                }
            });

        },
        template: '<li class="point"></li><li class="point"></li><li class="point"></li><li class="point"></li><li class="point"></li>'
    };

})
  
  
  .directive('fileDropzone', function() {
      return {
          restrict: 'A',
          scope: {
              file: '=',
              fileName: '='
          },
          link: function(scope, element, attrs) {
              var checkSize, isTypeValid, processDragOverOrEnter, validMimeTypes;
              processDragOverOrEnter = function(event) {
                  if (event !== null) {
                      event.preventDefault();
                  }
                  event.originalEvent.dataTransfer.effectAllowed = 'copy';
                  return false;
              };
              validMimeTypes = attrs.fileDropzone;
              checkSize = function(size) {
                  var _ref;
                  if (((_ref = attrs.maxFileSize) === (void 0) || _ref === '') || (size / 1024) / 1024 < attrs.maxFileSize) {
                      return true;
                  } else {
                      alert("File must be smaller than " + attrs.maxFileSize + " MB");
                      return false;
                  }
              };
              isTypeValid = function(type) {
                  if ((validMimeTypes === (void 0) || validMimeTypes === '') || validMimeTypes.indexOf(type) > -1) {
                      return true;
                  } else {
                      alert("Invalid file type.  File must be one of following types " + validMimeTypes);
                      return false;
                  }
              };
              element.bind('dragover', processDragOverOrEnter);
              element.bind('dragenter', processDragOverOrEnter);
              return element.bind('drop', function(event) {
                  var file, name, reader, size, type;
                  if (event !== null) {
                      event.preventDefault();
                  }
                  reader = new FileReader();
                  reader.onload = function(evt) {
                      if (checkSize(size) && isTypeValid(type)) {
                          return scope.$apply(function() {
                              scope.file = evt.target.result;
                              if (angular.isString(scope.fileName)) {
                                  scope.fileName = name;
                                  return name;
                              }
                          });
                      }
                  };
                  file = event.originalEvent.dataTransfer.files[0];
                  name = file.name;
                  type = file.type;
                  size = file.size;
                  reader.readAsDataURL(file);
                  return false;
              });
          }
      };
  })  
  
  .directive('categoryChooser', ['ProductManager', function(ProductManager) {
      return {
          restrict: 'E',
          replace: true,
          scope: {
              modelVar: '='
          },
          template: '<select ng-model="selectValue" ng-options="name for name in categoryNames"></select>',
		  //template: '<div class="btn-group center-block"><label ng-repeat="category in categories" class="btn btn-primary" ng-model="productData.category" btn-radio="category._id">{{category.name}}</label></div>',
          link: function(scope, element, attrs, ctrl) {
              var categoryIdToNameMapping = {}, categoryNameToIdMapping = {};
              
              scope.test = '';
			  scope.placeholderName = '';
			  scope.placeholderVariety = '';
			  scope.availableUnits = [];
              
              scope.categories = ProductManager.productCategories;
              
			  scope.$watch('categories', function (newValue) {
                  scope.categoryNames = ['--- Select a Category ---'];
                  categoryIdToNameMapping = {};
                  categoryNameToIdMapping = {};
                  newValue.forEach(function (category) {
                      if (category.name) {
                          scope.categoryNames.push(category.name);
                          categoryIdToNameMapping[category.name] = category._id;
                          categoryNameToIdMapping[category._id] = category.name;
						  scope.placeholderName = category.placeholderName;
						  scope.placeholderVariety = category.placeholderVariety;
                      }
                  });
              }, true);
              
              scope.$watch('modelVar', function (newValue) {
                  if (!newValue) {
                      scope.selectValue = '--- Select a Category ---';
                  } else {
                      scope.selectValue = categoryNameToIdMapping[newValue];
                  }
              });
              
              scope.$watch('selectValue', function (newValue) {
                  scope.modelVar = categoryIdToNameMapping[newValue];
              });
          }
      };
  }]);  

