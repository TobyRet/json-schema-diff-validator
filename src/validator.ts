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
  const arr = path.split('/');
  return arr[arr.length - 2];
}

export interface ValidatorOptions {
  allowNewOneOf?: boolean;
}

export function validateSchemaCompatibility(
  originalSchema: any,
  changedSchema: any,
  opts: ValidatorOptions = {},
): void {
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
        const isNewAnyOfItem = /items\/anyOf\/[\d]+$/.test(path);
        const pathTwoLastLevels = getSecondLastSubPath(path);

        if (pathTwoLastLevels !== props && pathTwoLastLevels !== defn) {
          if (isNewAnyOfItem && opts.allowNewOneOf) {
            // skip this
          } else {
            diff.push(node);
          }
        }

        if (pathTwoLastLevels === required) {
          diff.push(node);
        }

        break;

      default:
    }
  });

  // tslint:disable-next-line:max-line-length
  assert.strictEqual(diff.length, 0, `The schema is not backward compatible. Difference include breaking change = ${JSON.stringify(diff)}`);
}

export function validateSchemaFiles(
  file1: string,
  file2: string,
  opts: ValidatorOptions = {},
): void {
  const original = getData(file1);
  const changed = getData(file2);

  return validateSchemaCompatibility(original, changed, opts);
}
