import * as assert from 'assert';
import { deepClone } from 'fast-json-patch';
import * as fs from 'fs';
import * as path from 'path';
import {
  validateSchemaCompatibility,
  validateSchemaFiles,
} from '../src/validator';

describe('Validator API', () => {
  it('should not throw if schemas are the same', () => {
    const originalSchema = path.resolve('resources/data.schema');
    const newSchema = path.resolve('resources/data.schema');

    assert.doesNotThrow(() => validateSchemaCompatibility(originalSchema, newSchema));
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

    const newSchema = deepClone(originalSchema);

    newSchema.definitions.field = { type: 'number' };
    newSchema.required.push('field');

    assert.throws(() => validateSchemaCompatibility(originalSchema, newSchema));
  });

  it('should not throw if a field is added and it\'s not required', () => {
    const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
    const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

    const newSchema = deepClone(originalSchema);

    newSchema.definitions.mntent.properties.field = { type: 'number' };
    assert.doesNotThrow(() => validateSchemaCompatibility(originalSchema, newSchema));
  });

  it('should throw if a field becomes required', () => {
    const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
    const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

    const newSchema = deepClone(originalSchema);
    newSchema.required = ['/'];

    assert.throws(() => validateSchemaCompatibility(newSchema, originalSchema));
  });

  it('should not throw if field becomes optional', () => {
    const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
    const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

    const newSchema = deepClone(originalSchema);
    newSchema.required = ['/'];

    assert.doesNotThrow(() => validateSchemaCompatibility(originalSchema, newSchema));
  });

  it('should throw if field changes its type', () => {
    const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
    const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

    const newSchema = deepClone(originalSchema);

    newSchema.definitions.mntent = { type: 'number' };
    assert.throws(() => validateSchemaCompatibility(originalSchema, newSchema));
  });

  it('should throw even if node is added and it\'s required under subnodes', () => {
    const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
    const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

    const newSchema = deepClone(originalSchema);

    newSchema.definitions.mntent.properties.field = { type: 'number' };
    newSchema.definitions.mntent.required.push('field');

    assert.throws(() => validateSchemaCompatibility(originalSchema, newSchema));
  });

  it('should not throw if an example field is added', () => {
    const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
    const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

    const newSchema = deepClone(originalSchema);

    newSchema.properties.swap.examples = ['CREATE', 'UPDATE'];
    assert.doesNotThrow(() => validateSchemaCompatibility(originalSchema, newSchema));
  });

  it('should not throw if a description field is added', () => {
    const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
    const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

    const newSchema = deepClone(originalSchema);

    newSchema.properties.swap.description = 'Oh lovely';
    assert.doesNotThrow(() => validateSchemaCompatibility(originalSchema, newSchema));
  });

  it('should not throw if examples are updated', () => {
    const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
    const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

    const newSchema = deepClone(originalSchema);

    newSchema.properties.action.examples = ['CREATE'];
    assert.doesNotThrow(() => validateSchemaCompatibility(originalSchema, newSchema));
  });

  it('should not throw if descriptions are updated', () => {
    const schemaPath = path.resolve(`${__dirname}/../resources/data.schema`);
    const originalSchema = JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf-8' }));

    const newSchema = deepClone(originalSchema);

    newSchema.properties.action.description = 'An updated description';
    assert.doesNotThrow(() => validateSchemaCompatibility(originalSchema, newSchema));
  });
});
