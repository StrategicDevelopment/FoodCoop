var Transaction = require('./transaction')
	, mongoose = require('mongoose') // middleware for connecting to the mongodb database
	, Schema = mongoose.Schema // mongoose schema object for defining collections.
	, passportLocalMongoose = require('passport-local-mongoose')
	, _ = require('lodash') // this creates salted and hashed passwords
	, fs = require('fs')
	, path = require('path')
	, config = require('./../coopConfig.js')
	, markup = config.markup
	, gm = require('gm');
	
function toArray (listString) {
	if (typeof listString === 'string' && listString.length > 0) {
		return listString.split(/,\s*/);
	}
}

// User schema for all the common user properties. Password is left out as it is
// generated by passportLocalMongoose
var UserSchema = new Schema({
			dateJoined : {type: Date, default: Date.now()},
			regionID: [{type: Schema.ObjectId, ref: 'Region'}],
			email : {type: String, required: true, lowercase: true},
			phone : {type: String, required: true},
			address : {type: String, required: true},
			addressPermission : {type: Boolean, default: false},
			// this is for a future feature that will be a map of all our producers
			lat : Number,
			lng : Number,
			name : {type: String, required: true},
			user_type : {
				name: {type : String, required : true},
				canBuy: {type : Boolean, required : true},
				canSell: {type : Boolean, required : true},
				isAdmin: Boolean,
				isRouteManager: Boolean
			},
			producerData : {
				companyName : String,
				logo : {},
				thumbnail: String,
				description : String,
				certification : String,
				website : String,
				personalBio : String,
				chemicalDisclaimer: String,
				bankAccount : {type: String, default: 'NO ACCOUNT ON RECORD'}
			},
			routeManager: {
				title: String,
				townsOnRoute: {type: Array, set: toArray},
				pickupLocation: String
			},
			balance: {type: Number, default: 0},
			businessBalance: {type: Number, default: 0},
			useBusinessBalance: {type: Boolean, default: false},
			badges: [{type: Schema.ObjectId, ref: 'Badge'}],
			
			routeTitle: String,
			resetPasswordToken: String,
			resetPasswordExpires: Date
});
// delete the salt and hash from requests for the user objects
if (!UserSchema.options.toObject) UserSchema.options.toObject = {};

UserSchema.virtual('firstName').get(function() {
	return this.name.substr(0, this.name.indexOf(' '));
});
UserSchema.virtual('lastName').get(function() {
	return this.name.substr(this.name.indexOf(' ')+1);
});

// occurs just before an invoice is saved. should work with Model.create() shortcut
UserSchema.pre('save', function(next) {
	var user = this;
	// params for updating MailChimp
	if (user.name && user.email) {
		var params = {
			id: 'e481a3338d',
			email: {email: user.email},
			merge_vars : {
				FNAME : user.name.substr(0, user.name.indexOf(' ')),
				LNAME : user.name.substr(user.name.indexOf(' ')+1),
				USER_TYPE : user.user_type.name,
				ADDRESS : user.address,
				PHONE : user.phone
			}
		};
		if (!user.isNew) {
			mc.lists.updateMember(params, function(result) {}, function(err) {
				console.log(err);
			});
		}
	}
	next();
});

UserSchema.pre('save', function(next) {
	if (this.user_type.name === 'Producer' && this.producerData.hasOwnProperty('logo')) {
		var b64reg = /^data:image\/(jpeg|png|gif|tiff|webp);base64,/,
			logoName = this.producerData.companyName ? this.producerData.companyName.replace(/\.+|\/+|\?+|=+/, '') : this.name.replace(/\.+|\/+|\?+|=+/, '');
			
		
		if (b64reg.test(this.producerData.logo) ) {
			console.log('base64 logo detected. Beginning conversion.');
			//determine format. the actual string will be format[0]
			var format = b64reg.exec(this.producerData.logo);
			format = '.' + format[1];
			if (format === '.jpeg') format = '.jpg';
			
			var base64Data = this.producerData.logo.replace(/^data:image\/(jpeg|png|gif|tiff|webp);base64,/, ''),
				destination = path.normalize(path.join(__dirname, '../../app', 'upload', 'producer-logos', logoName+'+id-'+this._id+format)),
				thumbnailDestination = path.normalize(path.join(__dirname, '../../app', 'upload', 'producer-logos', 'thumbnails', logoName+ '-thumb' + '+id-'+this._id+format));
				 buff = new Buffer(base64Data, 'base64');
			//create main logo
			gm(buff).resize('450', '450').write(destination, function(err) {
				if (err) console.log(err);
				else console.log('Yay! successfully wrote new jpeg logo');
			});
			
			gm(buff).resize('150', '150').write(thumbnailDestination, function(err) {
				if (err) console.log(err);
				else console.log('Yay! successfully wrote new jpeg logo thumbnail');
			});
			
			this.producerData.logo = path.normalize(path.join('upload', 'producer-logos', logoName+'+id-'+this._id+format));
			this.producerData.thumbnail = path.normalize(path.join('upload', 'producer-logos', 'thumbnails', logoName+ '-thumb' + '+id-'+this._id+format));
		} // else if (this.producerData.logo){
// 			// create thumbnail
// 			gm(destination).resize('150', '150').write(thumbnailDestination, function(err) {
// 				if (err) return console.log(err);
// 				console.log('Yay! successfully wrote new jpeg logo thumbnail');
// 			});
// 			this.producerData.thumbnail = path.normalize(path.join('upload', 'producer-logos', 'thumbnails', logoName+ '-thumb' + '+id-'+this._id+'.jpg'));
// 		} else {
// 			console.log('deleting accidental thumbnail creation');
// 			this.producerData.thumbnail = undefined;
// 		}
	}
	next();
});

// make this schema have passwords and use the email field for usernames.
UserSchema.plugin(passportLocalMongoose, {usernameField: 'email'});

UserSchema.static('transaction', function(id, amount, options, cb) {
	// @id(_id) the _id of the user to perform a transaction for
	// @amount(number) the amount to transact, positive for credit, negative for debit
	// @options(object), options object with following properties
	//		-- title(string): a title for the transaction that could be the same as an invoice title
	//		-- reason(string): a reason for the transaction like 'products not available' or 'last minute extra order
	//		-- invoice(_id): _id of the invoice this transaction is tied to. The amount of the transaction and total of the invoice should be equal.
	//		-- businessBalance(boolean): this amount can go on businessBalance if available, usually used for credits for products sold.
	//		-- sandbox(boolean)
	if (!cb) {
		cb = options; // no options argument passed;
		options = {};
	}
	
	if ( !options.hasOwnProperty('title') ) options.title = amount > 0 ? 'general credit' : 'general debit';
	
	
	this.findById(id, 'balance businessBalance useBusinessBalance', function(err, user) {
		if (err) return cb(err);
		
		// adjust user's account.
		if (options.businessBalance && user.useBusinessBalance) {
			user.businessBalance += amount;
		} else user.balance += amount;

		user.save(function(err, user) {
			if (err) return cb(err);
			// create a transaction for this call
			Transaction.create({
				title: options.title,
				amount: amount,
				account: user._id,
				invoice: options.invoice,
				reason: options.reason,
				sandbox: options.sandbox
			}, function(err, transaction) {
				if (err) console.log(err);
			});
			cb(null, user);
		});
	});
});

module.exports = mongoose.model('User', UserSchema);