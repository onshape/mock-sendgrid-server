'use strict';

const restify = require('restify');

function API(sendgrid) {
  const self = this;

  sendgrid.apiServer = restify.createServer({
    name: sendgrid.options.name + ' API Server'
  });

  sendgrid.apiServer.use(restify.pre.sanitizePath());
  sendgrid.apiServer.use(restify.plugins.dateParser());
  sendgrid.apiServer.use(restify.plugins.queryParser());
  sendgrid.apiServer.use(restify.plugins.bodyParser());
  sendgrid.apiServer.use(restify.plugins.authorizationParser());

  sendgrid.apiServer.use(function (req, res, next) {
    const requestId = 'req_' + sendgrid.store.generateId(24);
    req.requestId = requestId;
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST, PUT');
    res.header('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization');

    res.header('Request-Id', requestId);
    res.header(sendgrid.options.name + '-version', sendgrid.version);

    if (!sendgrid.options.silent) {
      sendgrid.util.logger(req);
    }
    next();
  });

  //////////////////////////////////////////////////

  sendgrid.placeHolder = function(req, res, next) {
    console.log('%s: %s %s', sendgrid.util.colorize('cyan', 'UNIMPLEMENTED ENDPOINT'),
      req.method, req.url);

    res.send(200, {
      message: 'placeholder'
    });
    next();
  };

  sendgrid.apiServer.opts(/.*/, function(req, res, next) {
    res.send(200);
    next();
  });

  //////////////////////////////////////////////////
  // V2 API

  sendgrid.apiServer.post('/api/mail.send.json', function(req, res, next) {
    if (!req.body.api_user || !req.body.api_key ||
        !req.body.to || !req.body.subject || !req.body.from) {
      res.send(400, {
        message: 'missing required fields'
      });
      return next();
    }

    let who;

    for (const user of sendgrid.store.getUsers()) {
      if (req.body.api_user === user.username) {
        if (!user.password || req.body.api_key === user.password) {
          who = user;
          break;
        } else {
          res.send(401, {
            message: 'invalid username or password'
          });
          return next();
        }
      }
    }

    if (!who) {
      res.send(401, {
        message: 'invalid username or password'
      });
      return next();
    }

    sendgrid.messages.message({
      user: who.name,
      ip: req.remoteAddress,
      to: req.body.to,
      toName: req.body.toname,
      from: req.body.from,
      fromName: req.body.fromname,
      subject: req.body.subject,
      body: req.body.html || req.body.text
    });

    res.send(200, {
      message: 'success'
    });
    next();
  });

  //////////////////////////////////////////////////
  // Interaction API

  sendgrid.apiServer.get('/api/users', function(req, res, next) {
    const response = {
      items: [],
      count: 0
    };

    const users = sendgrid.store.getMessageStore();
    for (const item in users) {
      response.items.push({
        to: item,
        messages: users[item].length
      });
      response.count++;
    }

    res.send(200, response);
    next();
  });

  sendgrid.apiServer.get('/api/messages/:to', function(req, res, next) {
    const all = sendgrid.util.toBoolean(req.query.all);
    const full = sendgrid.util.toBoolean(req.query.full);
    const read = sendgrid.util.toBoolean(req.query.read);

    const messages = sendgrid.store.getMessages(req.params.to).
      filter(function(item) {
        if (all) {
          return true;
        } else {
          return (read) ? item.read : !item.read;
        }
      }).
      map(function(item, index) {
        const message = {
          id: item.id,
          index: index,
          to: item.to,
          from: item.from,
          subject: item.subject,
          read: item.read
        };

        if (full) {
          message.read = item.read = true;
          message.body = item.body;
        }

        return message;
      });

    const response = {
      items: messages,
      count: messages.length
    };

    res.send(200, response);
    next();
  });

  sendgrid.apiServer.get('/api/messages/:to/:index', function(req, res, next) {
    const message = sendgrid.store.getMessages(req.params.to)[req.params.index];
    if (message) {
      message.read = true;
      res.send(200, message);
    } else {
      res.send(404, {
        message: 'message not found'
      });
    }
    next();
  });

  sendgrid.apiServer.get('/api/message/:id', function(req, res, next) {
    const message = sendgrid.store.getMessageById(req.params.id);
    if (!message) {
      res.send(404, {
        message: 'message not found'
      });
    } else {
      res.send(200, message);
    }
    next();
  });

  //////////////////////////////////////////////////
  // Data Store API

  sendgrid.apiServer.get('/api/admin/messages', function(req, res, next) {
    const store = sendgrid.store.getMessageStore();
    res.sendRaw(200, JSON.stringify(store, null, 2));
    next();
  });

  sendgrid.apiServer.get('/data/store', function(req, res, next) {
    const store = sendgrid.store.getMessageStore();
    res.sendRaw(200, JSON.stringify(store, null, 2));
    next();
  });

  sendgrid.apiServer.post('/data/store/clear', function(req, res, next) {
    sendgrid.store.clear();
    res.send(200, {
      message: 'datastore cleared'
    });
    next();
  });

  //////////////////////////////////////////////////

  sendgrid.apiServer.get(/.*/, sendgrid.placeHolder);
  sendgrid.apiServer.post(/.*/, sendgrid.placeHolder);
  sendgrid.apiServer.put(/.*/, sendgrid.placeHolder);
  sendgrid.apiServer.head(/.*/, sendgrid.placeHolder);
  sendgrid.apiServer.del(/.*/, sendgrid.placeHolder);

  //////////////////////////////////////////////////

  self.boot = function() {
    sendgrid.apiServer.listen(sendgrid.config.apiPort, function() {
      console.log(`Mock Sendgrid API Server running on ${ sendgrid.config.apiPort }`);
    });
  };

  return self;
}

module.exports = function(sendgrid) {
  return new API(sendgrid);
};
