'use strict';

const crypto = require('crypto');

//////////////////////////////

Object.defineProperty(Array.prototype, 'findById', {
  value: function(id) {
    for (const obj of this) {
      if (obj.id && obj.id === id) {
        return obj;
      }
    }
    return undefined;
  },
  enumerable: false
});

Object.defineProperty(Array.prototype, 'sortByCreated', {
  value: function() {
    return this.sort(function(a, b) {
      const aCreated = a.created || a.date || a.timestamp;
      const bCreated = b.created || b.date || b.timestamp;
      if (aCreated > bCreated) {
        return -1;
      } else if (aCreated < bCreated) {
        return 1;
      } else {
        if (a.id > b.id) {
          return -1;
        } else if (a.id < b.id) {
          return 1;
        } else {
          return 0;
        }
      }
    });
  },
  enumerable: false
});

//////////////////////////////

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function ucFirst(string) {
  return string[0].toUpperCase() + string.slice(1);
}

function generateAlphaNumeric(length) {
  const possibleAlphaNumerics = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
  let generated = '';
  for (let i = 0; i < length; i++) {
    generated += possibleAlphaNumerics.charAt(rand(0, possibleAlphaNumerics.length - 1));
  }
  return generated;
}

function generateUniqueId(length) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex');
}

function getSHA1Hex(input) {
  if (typeof input !== 'string') {
    input = JSON.stringify(input);
  }
  return crypto.createHash('sha1').update(input).digest('hex');
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function timestamp() {
  return Math.floor(Date.now() / 1000);
}

const colors = {
  'black': 30,
  'red': 31,
  'green': 32,
  'yellow': 33,
  'blue': 34,
  'magenta': 35,
  'cyan': 36,
  'white': 37,

  'gray': 90,
  'grey': 90,
  'bright red': 91,
  'bright green': 92,
  'bright yellow': 93,
  'bright blue': 94,
  'bright magenta': 95,
  'bright cyan': 96,
  'bright white': 97
};

function colorize(name, string) {
  if (global && global.flags && global.flags.noColor ||
      (process.stdout && !process.stdout.isTTY)) {
    return string;
  }

  const color = colors[name] || colors.gray;
  return '\u001b[' + color + 'm' + string + '\u001b[0m';
}

console.json = function(json, printNonEnumerables) {
  return prettyPrint(json, {
    all: printNonEnumerables,
    print: true
  });
};

function prettyPrint(object, {
  all = false, print = true
} = {}) {
  function indent(depth) {
    return ('  ').repeat(depth);
  }

  function prettyPrinter(value, depth, overrideColor) {
    let line = indent(depth);
    if (typeof value === 'string') {
      line += colorize(overrideColor || 'green', '"' + value + '"');
    } else if (typeof value === 'number') {
      line += colorize(overrideColor || 'yellow', value);
    } else if (typeof value === 'boolean') {
      line += colorize(overrideColor || 'cyan', value);
    } else if (value === undefined || value === null) {
      line += colorize(overrideColor || 'magenta', value);
    } else if (value instanceof Date || value instanceof RegExp ||
               typeof value === 'function') {
      line += colorize('blue', value.toString());
    } else if (Array.isArray(value)) {
      line += '[';
      if (value.length) {
        line += '\n';
      }

      depth++;
      for (let i = 0; i < value.length; i++) {
        const comma = (i < value.length - 1) ? ',' : '';
        line += prettyPrinter(value[i], depth) + comma + '\n';
      }
      depth--;
      line += indent(depth) + ']';
    } else if (typeof value === 'object' && value instanceof Map) {
      line += 'Map {';
      if (value.size) {
        line += '\n';
      }

      depth++;
      let j = 0;
      value.forEach(function(itemValue, key) {
        const comma = (j < value.size - 1) ? ',' : '';
        line += prettyPrinter(key, depth, 'grey') + ': ';
        line += prettyPrinter(itemValue, depth) + comma + '\n';
        j++;
      });

      depth--;
      line += indent(depth) + '}';
    } else if (typeof value === 'object') {
      line += '{';
      let keys = Object.getOwnPropertyNames(value);
      if (keys.length) {
        line += '\n';
      }

      const enumerables = {};
      keys = keys.filter(function(key) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        enumerables[key] = descriptor.enumerable;
        return (descriptor.enumerable === true || all === true);
      });

      depth++;
      for (let j = 0; j < keys.length; j++) {
        const key = keys[j];
        const comma = (j < keys.length - 1) ? ',' : '';
        const keyColor = enumerables[key] ? 'gray' : 'red';
        line += prettyPrinter(key, depth, keyColor) + ': ';
        line += prettyPrinter(value[key], depth) + comma + '\n';
      }
      depth--;
      line += indent(depth) + '}';
    } else {
      line += colorize('bright red', value.toString());
    }

    return line.replace(/:\s+/g, ': ').
      replace(/([{[])\s+([}\]])/g, '$1$2');
  }

  const output = prettyPrinter(object, 0);

  if (print !== false) {
    console.log(output);
  }
  return output;
}

function toBoolean(value) {
  if (typeof value === 'string') {
    switch (value.toLowerCase()) {
      case 'true':
        return true;
      case 'false':
        return false;
      default:
        return false;
    }
  } else {
    return !!value;
  }
}

//////////////////////////////

function logger(req) {
  console.log(req.method, req.url, req.params, req.query);

  if (req.authorization) {
    console.json(req.authorization);
  }
  if (req.headers) {
    console.json(req.headers);
  }
  if (req.authorization) {
    console.json(req.authorization);
  }
  if (req.body) {
    console.json(req.body);
  }
}

//////////////////////////////

module.exports = {
  clone: clone,
  colorize: colorize,
  generateAlphaNumeric: generateAlphaNumeric,
  generateUniqueId: generateUniqueId,
  getSHA1Hex: getSHA1Hex,
  logger: logger,
  prettyPrint: prettyPrint,
  rand: rand,
  timestamp: timestamp,
  toBoolean: toBoolean,
  ucFirst: ucFirst
};
