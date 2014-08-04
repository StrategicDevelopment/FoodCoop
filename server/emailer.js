// Generated by CoffeeScript 1.7.1
(function() {
	var Emailer, emailer, smtpTransport, exports, config, fs, _;

	emailer = require("nodemailer");
	smtpTransport = require('nodemailer-smtp-transport');
	config = require('./config').Config;
	fs = require("fs");
	_ = require("underscore");

	Emailer = (function() {
		Emailer.prototype.options = {};

		Emailer.prototype.data = {};

		Emailer.prototype.attachments = [
		{
			filename: "logo.png",
			path: "../app/img/email/logo.png",
			cid: "logo@foodcoop"
		}
		];

		function Emailer(options, data) {
			this.options = options;
			this.data = data;
		}

		Emailer.prototype.send = function(callback) {
			var attachments, html, messageData, transport;
			html = this.getHtml(this.options.template, this.data);
			attachments = this.getAttachments(html);
			messageData = {
				from: 'Northland Natural Food Co-op',
				to: "'" + this.options.to.name + "' <" + this.options.to.email + ">",
				
				subject: this.options.subject,
				html: html,
				attachments: attachments
			};
			transport = this.getTransport();
			return transport.sendMail(messageData, callback);
		};

		Emailer.prototype.getTransport = function() {
			var opts;
			return emailer.createTransport(smtpTransport({
				service: "gmail",
				auth: config.gmailCredentials
			}))
		};

		Emailer.prototype.getHtml = function(templateName, data) {
			var encoding, templateContent, templatePath;
			templatePath = "./mailTemplates/" + templateName + ".html";
			templateContent = fs.readFileSync(templatePath, encoding = "utf8");
			return _.template(templateContent, data, {
				interpolate: /\{\{(.+?)\}\}/g
			});
		};

		Emailer.prototype.getAttachments = function(html) {
			var attachment, attachments, _i, _len, _ref;
			attachments = [];
			_ref = this.attachments;
			for (_i = 0, _len = _ref.length; _i < _len; _i++) {
				attachment = _ref[_i];
				if (html.search("cid:" + attachment.cid) > -1) {
					attachments.push(attachment);
				}
			}
			return attachments;
		};

		return Emailer;

	})();

	exports = module.exports = Emailer;

}).call(this);
