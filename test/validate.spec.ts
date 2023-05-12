import * as assert from 'assert';
import { deepClone } from 'fast-json-patch';
import * as fs from 'fs';
import * as path from 'path';
import {
  validateSchemaCompatibility,
  validateSchemaFiles,
} from '../src/validator';

const successfulValidationObject = {
  errors: [],
  valid: true,
};
describe('Validator API', () => {
  context('a valid schema change', () => {
    it('should pass validation when schemas are the same', () => {
      const originalSchema = path.resolve('resources/data.schema');
      const newSchema = path.resolve('resources/data.schema');

      const result = validateSchemaCompatibility(originalSchema, newSchema);

      assert.deepStrictEqual(result, successfulValidationObject);
    });

    it('should pass validation if a new property is added and it\'s not required', () => {
      const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
      const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));
      const newSchema = deepClone(originalSchema);
      newSchema.definitions.contact.properties.foo = { type: 'number' };

      const result = validateSchemaCompatibility(originalSchema, newSchema);

      assert.deepStrictEqual(result, successfulValidationObject);
    });

    it('should pass validation if a property becomes optional', () => {
      const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
      const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));
      const newSchema = deepClone(originalSchema);
      newSchema.definitions.contact.properties.required = ['action'];

      const result = validateSchemaCompatibility(originalSchema, newSchema);

      assert.deepStrictEqual(result, successfulValidationObject);
    });

    it(`should pass validation if an 'example' field is added to a property`, () => {
      const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
      const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));
      const newSchema = deepClone(originalSchema);
      newSchema.definitions.contact.properties.customerId.examples = ['12345678'];

      const result = validateSchemaCompatibility(originalSchema, newSchema);

      assert.deepStrictEqual(result, successfulValidationObject);
    });

    it(`should pass validation if a 'description' field is added to a property`, () => {
      const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
      const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));
      const newSchema = deepClone(originalSchema);
      newSchema.definitions.contact.properties.action.description = 'Oh lovely';

      const result = validateSchemaCompatibility(originalSchema, newSchema);

      assert.deepStrictEqual(result, successfulValidationObject);
    });

    it(`should pass validation if 'example' fields are updated`, () => {
      const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
      const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));
      const newSchema = deepClone(originalSchema);
      newSchema.definitions.contact.properties.action.examples = ['UPDATE', 'CREATE'];

      const result = validateSchemaCompatibility(originalSchema, newSchema);

      assert.deepStrictEqual(result, successfulValidationObject);
    });

    it(`should pass validation if 'description' fields are updated`, () => {
      const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
      const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

      const newSchema = deepClone(originalSchema);

      newSchema.definitions.contact.properties.customerId.description = 'An updated description';

      const result = validateSchemaCompatibility(originalSchema, newSchema);

      assert.deepStrictEqual(result, successfulValidationObject);
    });
  });

  context('an invalid schema change', () => {
    it('should not pass validation when properties are removed', () => {
      const file1 = path.resolve('resources/data.schema');
      const file2 = path.resolve('resources/data_with_field_removed.schema');

      const result = validateSchemaFiles(file1, file2);
      const expectedValidationObject = {
        errors: [
          'Detected a missing property or field. Path - "/definitions/contact/properties/customerName"',
        ],
        valid: false,
      };

      assert.deepStrictEqual(result, expectedValidationObject);
    });

    it('should not pass validation if a property is added and it\'s required', () => {
      const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
      const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));
      const newSchema = deepClone(originalSchema);
      newSchema.definitions.contact.properties.phone = { type: 'string' };
      newSchema.definitions.contact.required.push('phone');

      const result = validateSchemaCompatibility(originalSchema, newSchema);
      const expectedValidationObject = {
        errors: [
          'Detected an additional required property, or disallowed property or field. Path - "/definitions/contact/required/2"',
        ],
        valid: false,
      };

      assert.deepStrictEqual(result, expectedValidationObject);
    });

    it('should not pass validation if a property becomes required', () => {
      const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
      const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

      const newSchema = deepClone(originalSchema);
      newSchema.definitions.contact.required.push('customerName');

      const result = validateSchemaCompatibility(originalSchema, newSchema);

      const expected = {
        errors: ['Detected an additional required property, or disallowed property or field. Path - "/definitions/contact/required/2"'],
        valid: false,
      };

      assert.deepStrictEqual(result, expected);
    });

    it('should not pass validation if a property changes its type', () => {
      const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
      const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

      const newSchema = deepClone(originalSchema);

      newSchema.definitions.contact.properties.customerId = { description: 'The customer name', type: 'number' };

      const result = validateSchemaCompatibility(originalSchema, newSchema);

      const expected = {
        errors: ['Detected a change to a field value. Path - "/definitions/contact/properties/customerId/type"'],
        valid: false,
      };

      assert.deepStrictEqual(result, expected);
    });
  });
});
