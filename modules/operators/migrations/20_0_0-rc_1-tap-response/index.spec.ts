import * as path from 'path';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { createWorkspace } from '@ngrx/schematics-core/testing';
import { tags } from '@angular-devkit/core';

describe('migrate tapResponse', () => {
  const collectionPath = path.join(__dirname, '../migration.json');
  const schematicRunner = new SchematicTestRunner('schematics', collectionPath);
  let appTree: UnitTestTree;

  beforeEach(async () => {
    appTree = await createWorkspace(schematicRunner, appTree);
  });

  const verifySchematic = async (input: string, output: string) => {
    appTree.create('main.ts', input);

    const tree = await schematicRunner.runSchematic(
      `tap-response-observer`,
      {},
      appTree
    );

    const actual = tree.readContent('main.ts');
    expect(actual).toBe(output);
  };

  it('should migrate basic tapResponse signature', async () => {
    const input = tags.stripIndent`
import { tapResponse } from '@ngrx/component';

tapResponse(() => {}, () => {});
    `;

    const output = tags.stripIndent`
import { tapResponse } from '@ngrx/component';

tapResponse({ next: () => {}, error: () => {} });
    `;

    await verifySchematic(input, output);
  });

  it('should migrate tapResponse with complete callback', async () => {
    const input = tags.stripIndent`
tapResponse(() => next, () => error, () => complete);
    `;

    const output = tags.stripIndent`
tapResponse({ next: () => next, error: () => error, complete: () => complete });
    `;

    await verifySchematic(input, output);
  });

  it('should migrate aliased tapResponse calls', async () => {
    const input = tags.stripIndent`
const myTapResponse = tapResponse;

myTapResponse(() => next, () => error);
    `;

    const output = tags.stripIndent`
const myTapResponse = tapResponse;

myTapResponse({ next: () => next, error: () => error });
    `;

    await verifySchematic(input, output);
  });

  it('should migrate namespaced tapResponse calls', async () => {
    const input = tags.stripIndent`
import * as operators from '@ngrx/component';

operators.tapResponse(() => next, () => error, () => complete);
    `;

    const output = tags.stripIndent`
import * as operators from '@ngrx/component';

operators.tapResponse({ next: () => next, error: () => error, complete: () => complete });
    `;

    await verifySchematic(input, output);
  });
});
