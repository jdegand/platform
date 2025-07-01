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
      const tapResponseIdentifiers = new Set(['tapResponse']);

      // Track aliases like: const myTapResponse = tapResponse;
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isVariableStatement(node)) {
          node.declarationList.declarations.forEach((decl) => {
            if (
              ts.isIdentifier(decl.name) &&
              decl.initializer &&
              ts.isIdentifier(decl.initializer) &&
              decl.initializer.text === 'tapResponse'
            ) {
              tapResponseIdentifiers.add(decl.name.text);
            }
          });
        }
      });

      visitCallExpression(sourceFile, (node) => {
        const { expression, arguments: args } = node;

        // Always preserve original call expression text (e.g. operators.tapResponse or myTapResponse)
        const callText = expression.getText();

        let fnName = '';
        if (ts.isIdentifier(expression)) {
          fnName = expression.text;
        } else if (ts.isPropertyAccessExpression(expression)) {
          fnName = expression.name.text;
        }

        if (
          tapResponseIdentifiers.has(fnName) &&
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

          const newText = `${callText}({ ${observerProps.join(', ')} })`;

          changes.push(
            createReplaceChange(sourceFile, node, node.getText(), newText)
          );
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
