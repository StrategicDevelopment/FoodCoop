// Generated by CoffeeScript 1.9.1
(function() {
  var async, config, ip_pool, mandrill, mandrill_client, message, moment, template_content, template_name;

  moment = require('moment');

  config = require('./../config').Config;

  mandrill = require('mandrill-api/mandrill');

  mandrill_client = new mandrill.Mandrill(config.mandrillCredentials.pass);

  console.log("Running mandrill test");

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

  mandrill_client.messages.sendTemplate({
    'template_name': template_name,
    'template_content': template_content,
    'message': message,
    'async': async,
    'ip_pool': ip_pool
  }, (function(result) {
    console.log(result);

    /*
    [{
            "email": "recipient.email@example.com",
            "status": "sent",
            "reject_reason": "hard-bounce",
            "_id": "abc123abc123abc123abc123abc123"
        }]
     */
  }), function(e) {
    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
  });

}).call(this);
