#! /usr/bin/env node

import * as assert from 'assert';
import { resolve } from 'path';
import { validateSchemaFiles } from '../src/validator';

runValidator();

function runValidator() {
  const errString = 'Usage: json-schema-diff-validator schemafile1 schemafile2';
  const args = process.argv.slice(2);
  assert.strictEqual(args.length, 2, errString);

  const files = args.map(file => resolve(file));
  validateSchemaFiles(files[0], files[1]);
}
