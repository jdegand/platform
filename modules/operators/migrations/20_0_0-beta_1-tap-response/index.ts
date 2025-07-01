import { Rule, Tree, SchematicContext } from '@angular-devkit/schematics';
import {
  visitTSSourceFiles,
  createReplaceChange,
  commitChanges,
  Change,
} from '@ngrx/component/schematics-core';
import { visitCallExpression } from '@ngrx/schematics-core/utility/visitors';

import ts = require('typescript');

export default function migrateTapResponse(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    visitTSSourceFiles(tree, (sourceFile) => {
      const changes: Change[] = [];

      visitCallExpression(sourceFile, (node) => {
        const { expression, arguments: args } = node;

        if (
          ts.isIdentifier(expression) ||
          ts.isPropertyAccessExpression(expression)
        ) {
          const fnName = expression.getText();

          if (
            fnName.includes('tapResponse') &&
            args.length >= 2 &&
            args.length <= 3
          ) {
            const observerProps = [
              `next: ${args[0].getText()}`,
              `error: ${args[1].getText()}`,
            ];

            if (args[2]) {
              observerProps.push(`complete: ${args[2].getText()}`);
            }

            const newText = `${fnName}({ ${observerProps.join(', ')} })`;

            changes.push(
              createReplaceChange(sourceFile, node, node.getText(), newText)
            );
          }
        }
      });

      if (changes.length) {
        commitChanges(tree, sourceFile.fileName, changes);
        context.logger.info(
          `[rxjs] Migrated deprecated tapResponse in ${sourceFile.fileName}`
        );
      }
    });
  };
}
