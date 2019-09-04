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

  describe('allowReorder', () => {
    const schemaPath = path.resolve(`${__dirname}/../resources/data_options_allowReorder.schema`);
    const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

    const newSchema = deepClone(originalSchema);
    newSchema.definitions.status_node = {
      type: 'object',
    };
    const [first, ...others] = newSchema.definitions.inline_node.anyOf;
    newSchema.definitions.inline_node.anyOf = [
      first,
      { $ref: '#/definitions/status_node' },
      ...others,
    ];

    context('allowReorder is not', () => {
      it('should throw if items are reordered', () => {
        assert.throws(() => validateSchemaCompatibility(originalSchema, newSchema));
      });
    });

    context('allowReorder = True', () => {
      it('should not throw if items are reordered', () => {
        assert.doesNotThrow(() => validateSchemaCompatibility(originalSchema, newSchema, { allowReorder: true }));
      });

      it('should throw if items are removed as a result of reordering', () => {
        const invalidSchema = deepClone(newSchema);
        invalidSchema.definitions.inline_node.anyOf = [
          { $ref: '#/definitions/status_node' },
          ...others,
        ];
        assert.throws(() => validateSchemaCompatibility(originalSchema, invalidSchema, { allowReorder: true }));
      });
    });

    context('allowReorder = False', () => {
      it('should throw if items are reordered', () => {
        assert.throws(() => validateSchemaCompatibility(originalSchema, newSchema, { allowReorder: false }));
      });
    });

  });

  describe('minItems', () => {
    const schemaPath = path.resolve(`${__dirname}/../resources/data_minItems.schema`);
    const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));
    let newSchema: any;
    beforeEach(() => {
      newSchema = deepClone(originalSchema);
    });

    it('should not throw if minItems is removed', () => {
      delete newSchema.definitions.doc.properties.content.minItems;
      assert.doesNotThrow(() => {
        validateSchemaCompatibility(originalSchema, newSchema);
      });
    });

    it('should not throw if minItems is replaced with smaller value', () => {
      newSchema.definitions.doc.properties.content.minItems = 0;
      assert.doesNotThrow(() => {
        validateSchemaCompatibility(originalSchema, newSchema);
      });
    });

    it('should throw if minItems is replaced with greater value', () => {
      newSchema.definitions.doc.properties.content.minItems = 10;
      assert.throws(() => {
        validateSchemaCompatibility(originalSchema, newSchema);
      });
    });
  });

  describe('deprecatedItems', () => {
    const schemaPath = path.resolve(`${__dirname}/../resources/data_options_deprecatedItems.schema`);
    const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));
    let newSchema: any;
    beforeEach(() => {
      newSchema = deepClone(originalSchema);
    });

    it('should not throw if removed item is suppose to be deprecated', () => {
      delete newSchema.definitions.old_node;
      delete newSchema.definitions.block_content.anyOf[0];
      assert.doesNotThrow(() => {
        validateSchemaCompatibility(originalSchema, newSchema, { deprecatedItems: ['old_node'] });
      });
    });
  });
});
