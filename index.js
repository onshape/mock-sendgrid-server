#!/usr/bin/env node
'use strict';

const fs = require('fs');

const args = process.argv.slice(2);
const options = require('minimist')(args);

const config = {};
const configFile = options.config || options.c || './config.json';
try {
  if (fs.existsSync(configFile)) {
    console.log(`Loading configuration from ${ configFile }...`);
    const data = JSON.parse(fs.readFileSync(configFile));
    Object.assign(config, data);
  }
} catch (error) {
  console.log('Failed to load configuration', error);
}

const SendgridServer = require('./lib/sendgridServer');
const sendgridServer = new SendgridServer(options, config);

sendgridServer.boot();
