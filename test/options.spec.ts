import * as assert from 'assert';
import { deepClone } from 'fast-json-patch';
import * as fs from 'fs';
import * as path from 'path';
import {
  validateSchemaCompatibility,
} from '../src/validator';

const successfulValidationObject = {
  errors: [],
  valid: true,
};

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
        const results = validateSchemaCompatibility(originalSchema, newSchema);

        const expectedErrorValidationObject = {
          errors: [
            'Detected an additional required property, or disallowed property or field. Path - "/definitions/inline_node/anyOf/1"',
            'Detected an additional required property, or disallowed property or field. Path - "/definitions/anotherItem/content/items/0/anyOf/2"',
            'Detected an additional required property, or disallowed property or field. Path - "/definitions/root/items/anyOf/1"',
          ],
          valid: false,
        };

        assert.deepStrictEqual(results, expectedErrorValidationObject);
      });
    });

    context('allowNewOneOf = True', () => {
      it('should not throw if there are new oneOf elements', () => {
        const results = validateSchemaCompatibility(originalSchema, newSchema, { allowNewOneOf: true });

        assert.deepStrictEqual(results, successfulValidationObject);
      });
    });

    context('allowNewOneOf = False', () => {
      it('should throw if there are new oneOf elements', () => {
        const results = validateSchemaCompatibility(originalSchema, newSchema, { allowNewOneOf: false });

        const expectedErrorValidationObject = {
          errors: [
            'Detected an additional required property, or disallowed property or field. Path - "/definitions/inline_node/anyOf/1"',
            'Detected an additional required property, or disallowed property or field. Path - "/definitions/anotherItem/content/items/0/anyOf/2"',
            'Detected an additional required property, or disallowed property or field. Path - "/definitions/root/items/anyOf/1"',
          ],
          valid: false,
        };

        assert.deepStrictEqual(results, expectedErrorValidationObject);
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
        const results = validateSchemaCompatibility(originalSchema, newSchema);

        const expectedErrorValidationObject = {
          errors: [
            'Detected an additional required property, or disallowed property or field. Path - "/definitions/anotherItem/properties/tshirt/size/enum/2"',
            'Detected an additional required property, or disallowed property or field. Path - "/definitions/root/properties/fruit/type/enum/1"',
          ],
          valid: false,
        };

        assert.deepStrictEqual(results, expectedErrorValidationObject);
      });
    });

    context('allowNewEnumValue = True', () => {
      it('should not throw if there are new enum values', () => {
        const results = validateSchemaCompatibility(originalSchema, newSchema, { allowNewEnumValue: true });

        assert.deepStrictEqual(results, successfulValidationObject);
      });
    });

    context('allowNewEnumValue = False', () => {
      it('should throw if there are new enum values', () => {
        const results = validateSchemaCompatibility(originalSchema, newSchema, { allowNewEnumValue: false });

        const expectedErrorValidationObject = {
          errors: [
            'Detected an additional required property, or disallowed property or field. Path - "/definitions/anotherItem/properties/tshirt/size/enum/2"',
            'Detected an additional required property, or disallowed property or field. Path - "/definitions/root/properties/fruit/type/enum/1"',
          ],
          valid: false,
        };

        assert.deepStrictEqual(results, expectedErrorValidationObject);
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

    context('allowReorder is not set', () => {
      it('should throw if items are reordered', () => {
        const results = validateSchemaCompatibility(originalSchema, newSchema, { allowNewOneOf: true });

        const expectedErrorValidationObject = {
          errors: [
            'Detected a change to a field value. Path - "/definitions/inline_node/anyOf/2/$ref"',
            'Detected a change to a field value. Path - "/definitions/inline_node/anyOf/1/$ref"',
          ],
          valid: false,
        };

        assert.deepStrictEqual(results, expectedErrorValidationObject);
      });
    });

    context('allowReorder = True', () => {
      it('should not throw if items are reordered', () => {
        const result = validateSchemaCompatibility(originalSchema, newSchema, {
          allowNewOneOf: true,
          allowReorder: true,
        });

        assert.deepStrictEqual(result, successfulValidationObject);
      });

      it('should throw if items are removed as a result of reordering', () => {
        const invalidSchema = deepClone(newSchema);
        invalidSchema.definitions.inline_node.anyOf = [
          { $ref: '#/definitions/status_node' },
          ...others,
        ];

        const results = validateSchemaCompatibility(originalSchema, invalidSchema, { allowNewOneOf: true, allowReorder: true });

        const expectedErrorValidationObject = {
          errors: ['Detected a change to a field value. Path - "/definitions/inline_node/anyOf/0/$ref"'],
          valid: false,
        };

        assert.deepStrictEqual(results, expectedErrorValidationObject);
      });
    });

    context('allowReorder = False', () => {
      it('should throw if items are reordered', () => {
        const results = validateSchemaCompatibility(originalSchema, newSchema, { allowNewOneOf: true, allowReorder: false });

        const expectedErrorValidationObject = {
          errors: [
            'Detected a change to a field value. Path - "/definitions/inline_node/anyOf/2/$ref"',
            'Detected a change to a field value. Path - "/definitions/inline_node/anyOf/1/$ref"',
          ],
          valid: false,
        };

        assert.deepStrictEqual(results, expectedErrorValidationObject);
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

      const results = validateSchemaCompatibility(originalSchema, newSchema);

      assert.deepStrictEqual(results, successfulValidationObject);
    });

    it('should not throw if minItems is replaced with smaller value', () => {
      newSchema.definitions.doc.properties.content.minItems = 0;

      const results = validateSchemaCompatibility(originalSchema, newSchema);

      assert.deepStrictEqual(results, successfulValidationObject);
    });

    it('should throw if minItems is replaced with greater value', () => {
      newSchema.definitions.doc.properties.content.minItems = 10;

      const results = validateSchemaCompatibility(originalSchema, newSchema);

      const expectedErrorValidationObject = {
        errors: [
          'Detected a change to a field value. Path - "/definitions/doc/properties/content/minItems"',
        ],
        valid: false,
      };

      assert.deepStrictEqual(results, expectedErrorValidationObject);
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

      const results = validateSchemaCompatibility(originalSchema, newSchema, { deprecatedItems: ['old_node'] });

      assert.deepStrictEqual(results, successfulValidationObject);
    });
  });
});
