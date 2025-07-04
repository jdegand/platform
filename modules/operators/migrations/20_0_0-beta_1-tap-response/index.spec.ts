import * as path from 'path';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { createWorkspace } from '@ngrx/schematics-core/testing';
import { tags } from '@angular-devkit/core';
import { visitCallExpression } from '@ngrx/schematics-core/utility/visitors';
import * as ts from 'typescript';

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
      '20.0.0-beta_1-tap-response',
      {},
      appTree
    );

    const actual = tree.readContent('main.ts');
    //expect(actual.replace(/\s+/g, '')).toBe(output.replace(/\s+/g, ''));

    const normalize = (s: string) => s.replace(/\s+/g, '').replace(/;/g, '');
    expect(normalize(actual)).toBe(normalize(output));
  };

  it('migrates basic tapResponse signature', async () => {
    const input = `import { tapResponse } from '@ngrx/operators';
tapResponse(() => {}, () => {});
`;

    const output = `import { tapResponse } from '@ngrx/operators';
tapResponse({
    next: () => { },
    error: () => { }
});
`;

    await verifySchematic(input, output);
  });

  it('migrates tapResponse with complete callback', async () => {
    const input = `tapResponse(() => next, () => error, () => complete);
`;

    const output = `tapResponse({
    next: () => next,
    error: () => error,
    complete: () => complete
});
`;

    await verifySchematic(input, output);
  });

  it('migrates aliased tapResponse calls', async () => {
    const input = `const myTapResponse = tapResponse;
myTapResponse(() => next, () => error);
`;

    const output = `const myTapResponse = tapResponse;
myTapResponse({
    next: () => next,
    error: () => error
});
`;

    await verifySchematic(input, output);
  });

  it('migrates namespaced tapResponse calls', async () => {
    const input = `import * as operators from '@ngrx/operators';
operators.tapResponse(() => next, () => error, () => complete);
`;

    const output = `import * as operators from '@ngrx/operators';
operators.tapResponse({
    next: () => next,
    error: () => error,
    complete: () => complete
});
`;

    await verifySchematic(input, output);
  });

  it('skips tapResponse if not imported from @ngrx/operators', async () => {
    const input = `import { tapResponse } from '@ngrx/component';
tapResponse(() => {}, () => {});
`;

    // Expect NO transformation
    const output = `import { tapResponse } from '@ngrx/component';
tapResponse(() => {}, () => {});
`;

    await verifySchematic(input, output);
  });

  it('migrates tapResponse inside a full component-like body', async () => {
    const input = `import { tapResponse } from '@ngrx/operators';
function handle() {
  return tapResponse(() => next(), () => error(), () => complete());
}
`;

    const output = `import { tapResponse } from '@ngrx/operators';
function handle() {
  return tapResponse({
    next: () => next(),
    error: () => error(),
    complete: () => complete()
  });
}
`;

    await verifySchematic(input, output);
  });

  it('identify all call expressions including aliases and namespace calls', () => {
    const code = tags.stripIndent`
      import { tapResponse } from '@ngrx/operators';
      import * as operators from '@ngrx/operators';
      const myTapResponse = tapResponse;
      const anotherAlias = operators;
      tapResponse(() => {}, () => {});
      myTapResponse(() => {}, () => {});
      anotherAlias.tapResponse(() => {}, () => {});
    `;

    const sourceFile = ts.createSourceFile(
      'test.ts',
      code,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );

    const foundCalls: ts.CallExpression[] = [];

    visitCallExpression(sourceFile, (node) => {
      foundCalls.push(node);
    });

    expect(foundCalls.length).toBe(3);

    const callTexts = foundCalls.map((call) => call.getText());

    expect(callTexts).toContain('tapResponse(() => {}, () => {})');
    expect(callTexts).toContain('myTapResponse(() => {}, () => {})');
    expect(callTexts).toContain('anotherAlias.tapResponse(() => {}, () => {})');
  });
});
