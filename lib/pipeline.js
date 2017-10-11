'use strict';

function Pipeline(sendgrid) {
  const self = this;

  function stateTransition(message, newState) {
    if (!sendgrid.options.silent) {
      console.log('STATE TRANSITION %s [%s -> %s]', message.id, message.state, newState);
    }

    message.state = newState;

    sendgrid.webhooks.triggerEvent(message);

    return self.processMessage(message);
  }

  self.processMessage = function(message) {
    switch (message.state) {
      case sendgrid.messages.states.RECEIVED:
        if (message.to.includes(sendgrid.config.behaviors.drop)) {
          return stateTransition(message, sendgrid.messages.states.DROPPED);
        } else {
          return stateTransition(message, sendgrid.messages.states.PROCESSED);
        }
      case sendgrid.messages.states.PROCESSED:
        if (message.to.includes(sendgrid.config.behaviors.bounce)) {
          return stateTransition(message, sendgrid.messages.states.BOUNCE);
        } else if (message.to.includes(sendgrid.config.behaviors.defer)) {
          return stateTransition(message, sendgrid.messages.states.DEFERRED);
        } else {
          return stateTransition(message, sendgrid.messages.states.DELIVERED);
        }
      case sendgrid.messages.states.DELIVERED:
        if (message.to.includes(sendgrid.config.behaviors.open)) {
          return stateTransition(message, sendgrid.messages.states.OPEN);
        } else if (message.to.includes(sendgrid.config.behaviors.click)) {
          return stateTransition(message, sendgrid.messages.states.CLICK);
        } else if (message.to.includes(sendgrid.config.behaviors.unsubscribe)) {
          return stateTransition(message, sendgrid.messages.states.UNSUBSCRIBE);
        } else if (message.to.includes(sendgrid.config.behaviors.spam)) {
          return stateTransition(message, sendgrid.messages.states.spam);
        } else {
          return message;
        }
      default:
        return message;
    }
  };

  return self;
}

module.exports = function(sendgrid) {
  return new Pipeline(sendgrid);
};
