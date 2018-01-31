'use strict';

const async = require('async');
const request = require('request');

function Webhooks(sendgrid) {
  const self = this;

  const queue = async.queue(function(options, next) {
    return request(options, function(error, response) {
      if (!sendgrid.options.silent) {
        console.log('%s [%s/%s]: %s', sendgrid.util.colorize('blue', 'WEBHOOK'), response.statusCode, options.body[0].event, error || options.body[0].sg_message_id);
      }

      if (sendgrid.config.webhooks.delay) {
        return setTimeout(function() {
          return next();
        }, sendgrid.config.webhooks.delay);
      } else {
        return next();
      }
    });
  }, sendgrid.config.webhooks.concurrency);

  self.event = function(message) {
    const event = {
      sg_message_id: message.id,
      email: message.to,
      timestamp: message.timestamp,
      'smtp-id': message.messageId,
      event: message.state
    };
    return event;
  };

  self.sendEvents = function(webhook, events) {
    const options = {
      body: events,
      json: true,
      method: 'POST',
      url: webhook.url
    };

    if (webhook.username) {
      options.auth = {
        username: webhook.username,
        password: webhook.password
      };
    }

    queue.push(options);
  };

  self.triggerEvent = function(message) {
    if (message.user) {
      const webhooks = sendgrid.store.getWebhooks(message.user);
      if (Array.isArray(webhooks) && webhooks.length) {

        const event = self.event(message);

        for (const webhook of webhooks) {
          self.sendEvents(webhook, [ event ]);
        }
      }
    }
  };

  return self;
}

module.exports = function(sendgrid) {
  return new Webhooks(sendgrid);
};
