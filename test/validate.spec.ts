import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import {
  validateSchemaCompatibility,
  validateSchemaFiles,
} from '../src/validator';

describe('should validate schema when given two files:', () => {
  it('should return none if data is same', () => {
    const file1 = path.resolve('resources/data.schema');
    const file2 = path.resolve('resources/data.schema');
    const obj = validateSchemaFiles(file1, file2);

    assert.equal(obj, undefined, 'Object is defined');
  });

  it('should throw error on remove', () => {
    const file1 = path.resolve('resources/data.schema');
    const file2 = path.resolve('resources/data_v2.schema');

    assert.throws(() => {
      validateSchemaFiles(file1, file2);
    }, Error);
  });

  it('should throw if node is added and it\'s required', () => {
    const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
    const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

    const newSchema = {
      ...originalSchema,
      definitions: { ...originalSchema.definitions },
      required: [ ...originalSchema.required ],
    };

    newSchema.definitions.field = { type: 'number' };
    newSchema.required.push('field');

    assert.throws(() => validateSchemaCompatibility(originalSchema, newSchema));
  });

  it('should return none if field is added and it\'s not required', () => {
    const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
    const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

    const newSchema = {
      ...originalSchema,
      definitions: { ...originalSchema.definitions },
      required: [ ...originalSchema.required ],
    };

    newSchema.definitions.field = { type: 'number' };
    assert.doesNotThrow(() => validateSchemaCompatibility(originalSchema, newSchema));
  });

  it('should throw if field becomes required', () => {
    const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
    const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

    originalSchema.required = ['/'];

    const newSchema = {
      ...originalSchema,
      required: ['/', 'swap'],
    };

    assert.throws(() => validateSchemaCompatibility(originalSchema, newSchema));
  });

  it('should return none if field becomes optional', () => {
    const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
    const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

    const newSchema = {
      ...originalSchema,
      required: ['/'],
    };

    assert.doesNotThrow(() => validateSchemaCompatibility(originalSchema, newSchema));
  });

  it('should throw if field changes its type', () => {
    const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
    const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

    const newSchema = {
      ...originalSchema,
      definitions: { ...originalSchema.definitions },
    };

    newSchema.definitions.mntent = { type: 'number' };
    assert.throws(() => validateSchemaCompatibility(originalSchema, newSchema));
  });

});
