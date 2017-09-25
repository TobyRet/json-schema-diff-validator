import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { validateSchemaFiles } from '../src/validator';

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

  it('should throw error on add', () => {
    const file1 = path.resolve('resources/data.schema');
    const file2 = path.resolve('resources/data_v3.schema');

    assert.throws(() => {
      validateSchemaFiles(file1, file2);
    }, Error);
  });

});
