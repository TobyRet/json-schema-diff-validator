const jsonpatch = require('fast-json-patch');
const fs = require('fs');

function getData (fileName) {
  return JSON.parse(fs.readFileSync(fileName, 'utf8'));
}

function throwError (diff) {
  throw ( new Error(
    'The schema is not backward compatible. Difference include breaking change ='+ JSON.stringify(diff)));
}

function getSecondLastSubPath (path) {
  var index1 = path.lastIndexOf('/');
  var index2 = path.substr(0, index1).lastIndexOf('/');
  return path.substr(index2 + 1, index1);
}

exports.validateSchemaCompatibility = validateSchemaCompatibility;

function validateSchemaCompatibility (originalSchema, changedSchema) {
  const move = 'move';
  const remove = 'remove';
  const replace = 'replace';
  const add = 'add';
  var diff = [];
  var patch = jsonpatch.compare(originalSchema, changedSchema);
  
  patch.forEach(function (node) {
    var operation = node.op;
    switch (operation) {
      case move:
      case remove:
      case replace:
        diff.push(node);
        break;
      case add:
        const path = node.path;
        const staticString = 'properties';
        if (staticString !== getSecondLastSubPath(path)) {
          diff.push(node);
        }
    }
  });
  
  if (diff.length > 0) {
    throwError(diff);
  }
  return;
}

exports.validateSchemaFiles = validateSchemaFiles;

function validateSchemaFiles (file1, file2) {
  var original = getData(file1);
  const changed = getData(file2);
  return validateSchemaCompatibility(original, changed);
}






