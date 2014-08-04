'use strict';
/*global angular, User, Session*/

/* Services */

angular.module('co-op.services', [])
	
	.factory('Session', function (Restangular) {
		//return $resource('/auth/session/');
		return Restangular.all('auth/session');
		
	})
	/*
	.factory('User', function ($resource) {
			return {};
		})*/
	
	
	.factory("flash", function($rootScope) {
		var queue = [];
		var currentMessage = "";

		$rootScope.$on("$routeChangeSuccess", function() {
			currentMessage = queue.shift() || "";
		});

		return {
			setMessage: function(message) {
				queue.push(message);
			},
			getMessage: function() {
				return currentMessage;
			}
		};
	})
	
	.factory('LoginManager', function ($location, $rootScope, $cookieStore, Session, Restangular){
		return {
			login : function(provider, form, callback) {
				var cb = callback || angular.noop;
				Session.post({
					provider: 'local',
					email: form.email,
					password: form.password,
					rememberMe: form.rememberMe
					})
				.then(function (user) {
					if (typeof user === 'object') {
						var properties;
						var User = {};
						if (typeof user.plain === 'function'){
							user = user.plain();
						}
						console.log(user);
						properties = Object.getOwnPropertyNames(user);
						properties.forEach(function (key) {
							User[key] = user[key];
						});
										
						$rootScope.currentUser = User;
						return cb();
					}
				}, 
					function(err) {
						console.log(err.data);
						return cb();
					}
				
				);
			},
			
			isLoggedIn : function() {
				var loggedInUser, isLoggedIn;
				Session.customGET().then(function(user) {
					if (user === 'Not logged in') {
						console.log(user);
						return;
					}
					if (user.hasOwnProperty('email')) {
						loggedInUser = user.plain();
						delete loggedInUser.salt;
						delete loggedInUser.hash;
						console.log(loggedInUser);
						$rootScope.currentUser = loggedInUser;
						isLoggedIn = true;
					}
					else {isLoggedIn = false;}
					return isLoggedIn;
				});
			},
			
			logout : function() {
				Session.remove();
				$cookieStore.remove('user');
				$rootScope.currentUser = null;
				$location.path('/home');
			}
		};
	})
	
	.factory('LoginManagerOLD', function Auth($location, $rootScope, Session, User, $cookieStore) {
		$rootScope.currentUser = $cookieStore.get('User') || null;
		$cookieStore.remove('user');

		return {

		  login: function(provider, user, callback) {
			var cb = callback || angular.noop;
			Session.save({
			  provider: provider,
			  email: user.email,
			  password: user.password,
			  rememberMe: user.rememberMe
			}, function(User) {
			  $rootScope.currentUser = User;
			  return cb();
			}, function(err) {
			  return cb(err.data);
			});
		  },

		  logout: function(callback) {
			var cb = callback || angular.noop;
			Session.delete(function(res) {
				$rootScope.currentUser = null;
				return cb();
			  },
			  function(err) {
				return cb(err.data);
			  });
		  },
		};
	})
	
	.factory('PwdResetManager', ['$http', function($http) {
		return {
			pwdReset : function(resetData) {
				console.log('Reset Data' + resetData);
			}			
		};
	}])

	.factory('UserManager', function Auth($http, $rootScope, Restangular) {
		return {
			createUser: function(userinfo, callback) {
				var cb = callback || angular.noop;
				User.save(userinfo,
				  function(user) {
					$rootScope.currentUser = user;
					return cb();
				  },
				  function(err) {
					return cb(err.data);
				  });
			  },

			currentUser: function() {
				Session.get(function(user) {
				  $rootScope.currentUser = user;
				});
			  },

			changePassword: function(email, oldPassword, newPassword, callback) {
				var cb = callback || angular.noop;
				User.update({
				  email: email,
				  oldPassword: oldPassword,
				  newPassword: newPassword
				}, function(user) {
					console.log('password changed');
					return cb();
				}, function(err) {
					return cb(err.data);
				});
			  },
			
			  getUserLibrary: function(callback) {
			  	$http.get("api/user")
					.success(function(data, status, headers, config) {
						var users = data;
						return users;
					}).
					error(function(data, status, headers, config) {
						console.log('failed to get users from database' + status);
					});
				},
			
			removeUser: function(email, password, callback) {
				var cb = callback || angular.noop;
				User.delete({
				 	email: email,
				 	password: password
				}, function(user) {
					console.log(user + 'removed');
					return cb();
				}, function(err) {
					return cb(err.data);
				});
			  },
			userTypes : [
				{name : "Guest", canBuy:false, canSell:false },
				{name : "Customer", canBuy:true, canSell:false },
				{name : "Producer", canBuy:true, canSell:true },
			]
			
		};
	})
	
	.factory('ProductManager', ['$http', 'Restangular', '$rootScope', function($http, Restangular, $rootScope) {
        var module, productCategoryPromise, categoryIdMapping = {}, categoryNameMapping = {}, unitSuggestions = [];
        
        productCategoryPromise = Restangular.all("api/category");
        
        // When the categories are all loaded, cache a mapping from 
        // the id and the name to the object
        productCategoryPromise.getList().then(function (categories) {
            var i, category, unit;
            for (i in categories) {
                if (categories.hasOwnProperty(i)) {
                    category = categories[i];
                    if (category) {
                        categoryIdMapping[category._id] = category;
                        categoryNameMapping[category.name] = category;
						for (unit in category.availableUnits) {
							unitSuggestions.push(category.availableUnits[unit]);
						}
							
                    }
                }
            }
        });
        
		module = {
			registerProduct : function(productData) {
				//$http.post("api/product", productData);
				Restangular.all('api/product').post(productData);
			},
			
			unitSuggestions : unitSuggestions,
			
			productCategoryPromise : productCategoryPromise,
			
			productCategories : productCategoryPromise.getList().$object,
			
			certificationTypes: Restangular.all("api/certification").getList().$object,
			
			getUserProducts: function(callback){
				$http.get("api/product?producerCompany=:currentUser.producerData.companyName");
			},
            
            categoryByID: function (id) {
                return categoryIdMapping[id];
            },
            
            categoryByName: function (name) {
                return categoryNameMapping[name];
            }
		};
        
        return module;
	}])
	
	.factory('ProducerManager', ['$http', 'Restangular', '$rootScope', '$cookieStore', function($http, Restangular, $rootScope, $cookieStore) {
		return {
			saveProducer : function() {				
				console.log($rootScope.currentUser);
				Restangular.one('api/user', $rootScope.currentUser._id).customPOST($rootScope.currentUser, 'producer/edit');
			}
		};
	}])
	
	.factory('MailManager', ['$http', function($http) {
		return {
			mail : function(mail) {
				console.log('email message: ',  mail);
				$http.post('/api/mail', mail).success(function(response) {
					console.log('email message successfully sent');
					return response;
				});
			}
		};
	}])
	.service('OrderRecords', ['$http', function($http) {
		
		this.getOrders = function() {
			return orders;
		};
		
		this.addOrder = function(orderData) {
			orders.push(orderData);
		};
		
		this.sumSales = function() {
		 var total = 0;
		 for(var i=0; i < orders.length; i++) {
		 	console.log(i, ' order items = ', orders[i].price);
		 	total += orders[i].price; 
		 }
		 return total;
	  };

		
		var orders = [
			{product: 'Granny Smith Apples', quantity: 30, price: 2*30, customer: 'Sean Stanley'},
            {product: 'Spray-Free Oranges', quantity: 12, price: 2.5*12, customer: 'Matt Stanley'},
            {product: 'Romaine Lettuce', quantity: 27, price: 4*27, customer: 'Myles Green'},
            {product: 'Organic Basil', quantity: 7, price: 1.5*7, customer: 'Rowan Clements'},
            {product: 'Dozen Eggs', quantity: 4, price: 8*4, customer: 'Lisa Taylor'}
		];
	}])
	.service('CartRecords', ['$http', function($http) {
		
		this.getCart = function() {
			return cartItems;
		};
		
		this.addItem = function(productData) {
			cartItems.push(productData);
		};
		
		this.removeItem = function(i) {
			cartItems.splice(i, 1);
		};
		
		this.sumPrice = function() {
		 var total = 0;
		 for(var i=0; i < cartItems.length; i++) {
		 	total += cartItems[i].price; 
		 }
		 return total;
	  };

		
		var cartItems = [
			{product: 'Organic Blue-Veined Cheese', quantity: 1, price: 10, producer: 'Hiki Dairy Farm'},
            {product: 'Spray-Free Oranges', quantity: 2, price: 2.5*2, producer: 'Northland Naturals'},
            {product: 'Romaine Lettuce', quantity: 6, price: 4*6, producer: 'EcoBikes'},
            {product: 'Rosemary bunches', quantity: 4, price: 1*4, producer: 'Rowan Clements'},
            {product: 'Loafs of Gluten Free Bread', quantity: 3, price: 3.2*4, producer: 'Lisa Taylor'},
            {product: 'Organic Garlic and Basil Sausages', quantity: 2, price: 8.50*2, producer: 'Lisa Taylor'}
		];
	}])
	
	.factory('ProductHistory', ['$http', function($http) {
		var module = {
						
			getData : function(callback) {
				this.products = $http.get("/api/product").success(callback);
	        },
			addProduct : function(newData) {
				module.data.push(newData);
				console.log(module.data);
				return module.data;
			}
		};
		return module;
	}])
	
	.factory('ProducerList', ['$http', function($http) {
		var module = {
						
			getData : function(callback) {
	            $http.get("/api/user?user_type.name=Producer").success(callback);
	        },
			
			addProducer : function(newData) {
				module.data.push(newData);
				return module.data;

			},
			
		};
		
		return module;
	}]);

	
	/*
	.service('LocationService',  ['$http', function($http) {
	        var data;
			
	        this.getLocations = function(callback) {
				$http.get("/api/location").success(callback);
		    };
	
	        this.addLocation = function(locationData) {
	            data.push(locationData);
				$http.post("/api/location", locationData);
	        };
			
	
	    }]);   ------- Waiting to be deleted as no longer needed ---------*/ 
	
