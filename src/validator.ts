import {
  compare as jsonpatchCompare,
  Operation,
} from 'fast-json-patch';
import { AddOperation, ReplaceOperation } from 'fast-json-patch/lib/core';
import { readFileSync } from 'fs';
import * as jsonpointer from 'json-pointer';

function getData(fileName: string) {
  return JSON.parse(readFileSync(fileName, { encoding: 'utf-8' }));
}

function getSecondLastSubPath(path: string): string {
  const arr = path.split('/');
  return arr[arr.length - 2];
}

function getLastSubPath(path: string): string {
  const arr = path.split('/');
  return arr[arr.length - 1];
}

export interface ValidatorOptions {
  allowNewOneOf?: boolean;
  allowNewEnumValue?: boolean;
  allowReorder?: boolean;
  deprecatedItems?: string[];
}

export interface ValidationResponse {
  valid: boolean;
  errors?: string[];
}

export function validateSchemaCompatibility(
  originalSchema: any,
  changedSchema: any,
  opts: ValidatorOptions = {},
): ValidationResponse {
  const move = 'move';
  const remove = 'remove';
  const replace = 'replace';
  const add = 'add';
  let diff: Operation[] = [];
  const patch = jsonpatchCompare(originalSchema, changedSchema);

  const removed: Array<{ name: string, node: ReplaceOperation<any> }> = [];
  const inserted: string[] = [];

  patch.forEach(node => {
    const operation = node.op;
    const path = node.path;
    const required = 'required';
    const props = 'properties';
    const defn = 'definitions';
    const description = 'description';
    const examples = 'examples';
    const isMinItems = /minItems$/.test(path);

    switch (operation) {
      case move:
      case remove:
        if (
          getSecondLastSubPath(path) === required ||
          isMinItems
        ) {
          break;
        }

        /**
         * Check if the removed node is deprecated
         */
        const deprecatedItems = opts.deprecatedItems || [];
        const isAnyOfItem = /anyOf\/[\d]+$/.test(path);
        if (isAnyOfItem) {
          const value = jsonpointer.get(originalSchema, path);
          if (value.$ref && deprecatedItems.indexOf(getLastSubPath(value.$ref)) !== -1) {
            break;
          }
        } else {
          if (deprecatedItems.indexOf(getLastSubPath(path)) !== -1) {
            break;
          }
        }

        diff.push(node);

        break;

      case replace:
        if (
          getSecondLastSubPath(path) === examples || getLastSubPath(path) === description
        ) {
          break;
        }

        const oldValue = jsonpointer.get(originalSchema, path);
        if (isMinItems && oldValue > (node as ReplaceOperation<number>).value) {
          /** skip */
        } else {
          if (!opts.allowReorder) {
            diff.push(node);
          } else {
            removed.push({ name: oldValue, node: node as ReplaceOperation<any> });
            inserted.push((node as ReplaceOperation<any>).value);
          }
        }
        break;

      case add:
        if (
          getLastSubPath(path) === examples || getSecondLastSubPath(path) === examples || getLastSubPath(path) === description
        ) {
          break;
        }

        const isNewAnyOfItem = /anyOf\/[\d]+$/.test(path);
        const isNewEnumValue = /enum\/[\d]+$/.test(path);
        const pathTwoLastLevels = getSecondLastSubPath(path);

        if (pathTwoLastLevels !== props && pathTwoLastLevels !== defn && pathTwoLastLevels !== required) {
          if (isNewAnyOfItem && opts.allowReorder) {
            inserted.push((node as AddOperation<any>).value.$ref);
          } else if (
            (isNewAnyOfItem && opts.allowNewOneOf) ||
            (isNewEnumValue && opts.allowNewEnumValue)
          ) {
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

  if (opts.allowReorder) {
    // When reordering is allowed, we want to make sure that any item that
    // was replaced is also inserted somewhere else.
    diff = [
      ...diff,
      ...removed.filter(node => inserted.indexOf(node.name) === -1).map(node => node.node),
    ];
  }

  const valid = diff.length === 0;
  let errors: string[] = [];

  if (!valid) {
    const prettifyError = {
      add: 'Detected an additional required property, or disallowed property or field',
      move: 'Detected a property or field that has been moved',
      remove: 'Detected a missing property or field',
      replace: 'Detected a change to a field value',
    } as any;

    errors = diff.map((node) => {
      return `${prettifyError[node.op]}. Path - "${node.path}"`;
    });
  }

  return {
    errors,
    valid,
  };
}

export function validateSchemaFiles(
  file1: string,
  file2: string,
  opts: ValidatorOptions = {},
): ValidationResponse {
  const original = getData(file1);
  const changed = getData(file2);

  return validateSchemaCompatibility(original, changed, opts);
}
