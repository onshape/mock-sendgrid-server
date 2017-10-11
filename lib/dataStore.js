'use strict';

function DataStore(sendgrid) {
  const self = this;

  const store = {
    prefix: sendgrid.util.generateAlphaNumeric(6),

    users: [],
    webhooks: {},

    messages: {},
    index: {},

    counter: 0
  };

  self.generateId = function(length) {
    const id = (store.counter++).toString(16);
    return `${ store.prefix }${ '0'.repeat(length - (id.length + store.prefix.length)) }${ id }`;
  };

  self.ensureArray = function(map, property) {
    if (!Array.isArray(map[property])) {
      map[property] = [];
    }
    return map[property];
  };

  self.addUser = function(user) {
    user.name = user.name || user.username;

    if (user.webhooks) {
      store.webhooks[user.name] = user.webhooks;
    }

    return store.users.push(user);
  };

  self.getUsers = function() {
    return store.users;
  };

  self.getWebhooks = function(user) {
    return self.ensureArray(store.webhooks, user);
  };

  self.addMessage = function(to, message) {
    store.index[message.id] = message;
    return self.ensureArray(store.messages, to).push(message).length;
  };

  self.getMessage = function(to, index) {
    self.ensureArray(store.messages, to);

    index = (index !== undefined) ? index : store.messages[to].length - 1;

    return store.messages[to][index];
  };

  self.getMessageById = function(id) {
    return store.index[id];
  };

  self.getMessages = function(to) {
    return self.ensureArray(store.messages, to);
  };

  self.getAllMessages = function() {
    return store.messages;
  };

  self.popMessage = function(to) {
    return self.ensureArray(store.messages, to).shift();
  };

  self.popMessages = function(to) {
    const messages = self.ensureArray(store.messages, to);
    store.messsages[to] = [];
    return messages;
  };

  self.clearMessages = function() {
    store.messages = {};
    store.index = {};
  };

  return self;
}

module.exports = function(sendgrid) {
  return new DataStore(sendgrid);
};
