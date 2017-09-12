const assert = require('assert');
const fs = require('fs');
const path = require('path');
const validator = require('../src/validator');

describe('should validate schema when given two files:', function () {
  it('should return none if data is same', function () {
    var file1 = path.resolve('resources/data.schema');
    var file2 = path.resolve('resources/data.schema');
    var obj = validator.validateSchemaFiles(file1, file2);
    
    assert.equal(obj, undefined, "Object is defined");
  });
  
  it('should throw error on remove', function () {
    var file1 = path.resolve('resources/data.schema');
    var file2 = path.resolve('resources/data_v2.schema');
    
    assert.throws(function () {
      validator.validateSchemaFiles(file1, file2);
    }, Error);
  });
  
  it('should throw error on add', function () {
    var file1 = path.resolve('resources/data.schema');
    var file2 = path.resolve('resources/data_v3.schema');

    assert.throws(function () {
      validator.validateSchemaFiles(file1, file2);
    }, Error);
  });
  
});
