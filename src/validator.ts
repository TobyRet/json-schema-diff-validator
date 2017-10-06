import * as assert from 'assert';
import {
  compare as jsonpatchCompare,
  Operation,
} from 'fast-json-patch';
import { readFileSync } from 'fs';

function getData(fileName: string) {
  return JSON.parse(readFileSync(fileName, { encoding: 'utf-8' }));
}

function getSecondLastSubPath(path: string): string {
  const index1 = path.lastIndexOf('/');
  const index2 = path.substr(0, index1).lastIndexOf('/');
  return path.substr(index2 + 1, index1 - 1);
}

function getLastSubPath(path: string): string {
  const index1 = path.lastIndexOf('/');
  const index2 = path.length;
  return path.substr(index1 + 1 , index2);
}

export function validateSchemaCompatibility(originalSchema: any, changedSchema: any): void {
  const move = 'move';
  const remove = 'remove';
  const replace = 'replace';
  const add = 'add';
  const diff: Operation[] = [];
  const patch = jsonpatchCompare(originalSchema, changedSchema);

  patch.forEach(node => {
    const operation = node.op;
    const path = node.path;
    const required = 'required';
    const props = 'properties';
    const defn = 'definitions';

    switch (operation) {
      case move:
      case remove:
        if (getSecondLastSubPath(path) !== required) {
          diff.push(node);
        }

        break;

      case replace:
        diff.push(node);
        break;

      case add:

        if (getSecondLastSubPath(path) !== props && getSecondLastSubPath(path) !== defn ) {
          diff.push(node);
        }
        if (getSecondLastSubPath(path) === defn && getLastSubPath(path) === required ) {
          diff.push(node);
        }

        break;

      default:
    }
  });

  // tslint:disable-next-line:max-line-length
  assert.strictEqual(diff.length, 0, `The schema is not backward compatible. Difference include breaking change = ${JSON.stringify(diff)}`);
}

export function validateSchemaFiles(file1: string, file2: string): void {
  const original = getData(file1);
  const changed = getData(file2);

  return validateSchemaCompatibility(original, changed);
}
