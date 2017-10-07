import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import {
  validateSchemaCompatibility,
  validateSchemaFiles,
} from '../src/validator';

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

describe('Options', () => {
  describe('allowNewOneOf', () => {
    const schemaPath = path.resolve(`${__dirname}/../resources/data_options_allowOneOf.schema`);
    const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

    const newSchema = clone<any>(originalSchema);
    newSchema.definitions.root.items.anyOf.push({ type: 'number' });

    context('allowNewOneOf is not set', () => {
      it('should throw if there are new oneOf elements', () => {
        assert.throws(() => validateSchemaCompatibility(originalSchema, newSchema));
      });
    });

    context('allowNewOneOf = True', () => {
      it('should not throw if there are new oneOf elements', () => {
        assert.doesNotThrow(() => {
          validateSchemaCompatibility(originalSchema, newSchema, { allowNewOneOf: true });
        });
      });
    });

    context('allowNewOneOf = False', () => {
      it('should throw if there are new oneOf elements', () => {
        assert.throws(() => {
          validateSchemaCompatibility(originalSchema, newSchema, { allowNewOneOf: false });
        });
      });
    });
  });
});
