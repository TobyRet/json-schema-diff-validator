#! /usr/bin/env node
const fs = require('fs');
const path = require('path');
const validator = require('../src/validator');

runValidator();
function runValidator () {
  const errString = 'Usage : json-schema-diff-validator schemafile1 schemafile2';
  var args = process.argv.slice(2);
  if (args.length === 2) {
    const files = args.map(file => path.resolve(file));
    validator.validateSchemaFiles(files[0], files[1]);
  } else {
    console.error(errString);
  }
}
