(function() {
  var _, async, config, coopConfig, getEmails, ip_pool, mandrill, mandrill_client, message, moment, sendMessage, sendTemplate, template_content, template_name;

  moment = require('moment');

  _ = require('lodash');

  config = require('./config').Config;

  coopConfig = require('./coopConfig');

  mandrill = require('mandrill-api/mandrill');

  mandrill_client = new mandrill.Mandrill(config.mandrillCredentials.pass);

  template_name = 'delivery-day-template';

  template_content = [];

  message = {
    'to': [
      {
        'email': 'sean@maplekiwi.com',
        'name': 'Sean Stanley',
        'type': 'to'
      }
    ],
    'headers': {
      'Reply-To': 'message.reply@example.com'
    },
    'important': false,
    'track_opens': true,
    'track_clicks': true,
    'auto_text': true,
    'auto_html': null,
    'inline_css': null,
    'url_strip_qs': null,
    'preserve_recipients': null,
    'view_content_link': null,
    'bcc_address': null,
    'tracking_domain': null,
    'signing_domain': null,
    'return_path_domain': null,
    'merge': true,
    'merge_language': 'mailchimp',
    'global_merge_vars': [
      {
        'name': 'COMPANY',
        'content': 'Northland Natural Food Co-op Ltd.'
      }
    ],
    'merge_vars': [
      {
        'rcpt': 'sean@maplekiwi.com',
        'vars': [
          {
            'FNAME': 'Sean'
          }
        ]
      }
    ],
    'tags': ['test-from-node'],
    'subaccount': null,
    'google_analytics_domains': ['foodcoop.nz'],
    'google_analytics_campaign': 'message.sean@foodcoop.nz',
    'metadata': {
      'website': 'foodcoop.nz'
    },
    'recipient_metadata': [
      {
        'rcpt': 'sean@maplekiwi.com',
        'values': {
          'user_id': 123456
        }
      }
    ]
  };

  async = false;

  ip_pool = 'Main Pool';

  getEmails = function(user) {
    return {
      email: user.email,
      name: user.name,
      type: 'to'
    };
  };

  sendTemplate = function(templateName, recipients, options, callback) {
    var getMergeVars;
    if (!_.isArray(recipients)) {
      recipients = [recipients];
    }
    if (arguments.length === 3) {
      if (typeof arguments[2] === 'function') {
        callback = options;
      }
      if (typeof arguments[2] === 'object') {
        callback = _.noop;
      }
    }
    if (options == null) {
      options = {};
    }
    message = {
      'important': options.important || false,
      'headers': {
        'Reply-To': coopConfig.adminEmail.email
      },
      'track_opens': true,
      'track_clicks': true,
      'auto_text': true,
      'merge': true,
      'merge_language': options.mergeLanguage || 'mailchimp',
      'global_merge_vars': [
        {
          'name': 'COMPANY',
          'content': 'Northland Natural Food Co-op Ltd.'
        }
      ],
      'tags': options.tags || [],
      'google_analytics_domains': ['foodcoop.nz'],
      'google_analytics_campaign': 'message.sean@foodcoop.nz',
      'metadata': {
        'website': 'foodcoop.nz'
      }
    };
    getMergeVars = function(user) {
      var data;
      data = {
        rcpt: user.email,
        vars: [
          {
            'FNAME': user.name.split(" ").slice(0, -1).join(" ")
          }
        ]
      };
      if (options.data != null) {
        _.extend(data.vars[0], options.data);
      }
      return data;
    };
    message.to = _.map(recipients, getEmails);
    message.merge_vars = _.map(recipients, getMergeVars);
    return mandrill_client.messages.sendTemplate({
      'template_name': templateName,
      'template_content': options.templateContent || [],
      'message': message,
      'async': async,
      'ip_pool': ip_pool
    }, function(result) {
      return callback(null, result);
    }, function(e) {
      return callback(e);
    });
  };

  sendMessage = function(messageHtml, recipients, subject, options, callback) {
    if (!_.isArray(recipients)) {
      recipients = [recipients];
    }
    if (arguments.length === 4) {
      if (typeof arguments[3] === 'function') {
        callback = options;
      }
      if (typeof arguments[3] === 'object') {
        callback = _.noop;
      }
    }
    if (options == null) {
      options = {};
    }
    message = {
      'important': options.important || false,
      'headers': {
        'Reply-To': coopConfig.adminEmail.email
      },
      'track_opens': true,
      'track_clicks': true,
      'auto_text': true,
      'html': messageHtml,
      "from_email": 'sean@foodcoop.nz',
      "from_name": 'Northland Natural Food Co-op',
      "subject": subject,
      'merge': true,
      'merge_language': options.mergeLanguage || 'mailchimp',
      'global_merge_vars': [
        {
          'name': 'COMPANY',
          'content': 'Northland Natural Food Co-op Ltd.'
        }
      ],
      'tags': options.tags || [],
      'google_analytics_domains': ['foodcoop.nz'],
      'google_analytics_campaign': 'message.sean@foodcoop.nz',
      'metadata': {
        'website': 'foodcoop.nz'
      }
    };
    message.to = _.map(recipients, getEmails);
    return mandrill_client.messages.send({
      'message': message
    }, function(result) {
      return callback(null, result);
    }, function(e) {
      return callback(e);
    });
  };

  exports.send = sendTemplate;

  exports.sendMessage = sendMessage;

}).call(this);
