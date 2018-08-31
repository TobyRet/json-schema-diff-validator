import * as assert from 'assert';
import { deepClone } from 'fast-json-patch';
import * as fs from 'fs';
import * as path from 'path';
import {
  validateSchemaCompatibility,
  validateSchemaFiles,
} from '../src/validator';

describe('Options', () => {
  describe('allowNewOneOf', () => {
    const schemaPath = path.resolve(`${__dirname}/../resources/data_options_allowOneOf.schema`);
    const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

    const newSchema = deepClone(originalSchema);
    newSchema.definitions.root.items.anyOf.push({ type: 'number' });
    newSchema.definitions.anotherItem.content.items[0].anyOf.push({ fruit: 'pear' });
    newSchema.definitions.inline_node.anyOf.push(`{ "$ref": "#/definitions/hardBreak_node" }`);

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

  describe('allowNewEnumValue', () => {
    const schemaPath = path.resolve(`${__dirname}/../resources/data_options_allowNewEnumValue.schema`);
    const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

    const newSchema = deepClone(originalSchema);
    newSchema.definitions.root.properties.fruit.type.enum.push('banana');
    newSchema.definitions.anotherItem.properties.tshirt.size.enum.push('large');

    context('allowNewEnumValue is not set', () => {
      it('should throw if there are new enum values', () => {
        assert.throws(() => validateSchemaCompatibility(originalSchema, newSchema));
      });
    });

    context('allowNewEnumValue = True', () => {
      it('should not throw if there are new enum values', () => {
        assert.doesNotThrow(() => {
          validateSchemaCompatibility(originalSchema, newSchema, { allowNewEnumValue: true });
        });
      });
    });

    context('allowNewEnumValue = False', () => {
      it('should throw if there are new enum values', () => {
        assert.throws(() => {
          validateSchemaCompatibility(originalSchema, newSchema, { allowNewEnumValue: false });
        });
      });
    });
  });
});
