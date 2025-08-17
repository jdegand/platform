import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import * as path from 'path';
import { createRule } from '../../rule-creator';
import { isArrayExpression } from '../../utils';
import ts = require('typescript');

export const messageId = 'signalStateNoArraysAtRootLevel';

type MessageIds = typeof messageId;
type Options = readonly [];

export default createRule<Options, MessageIds>({
  name: path.parse(__filename).name,
  meta: {
    type: 'problem',
    ngrxModule: 'signals',
    docs: {
      description: `signalState should accept a record or dictionary as an input argument.`,
      requiresTypeChecking: true,
    },
    schema: [],
    messages: {
      [messageId]: `Wrap the value in a record or dictionary.`,
    },
  },
  defaultOptions: [],
  create: (context) => {
    return {
      [`CallExpression[callee.name=signalState]`](
        node: TSESTree.CallExpression
      ) {
        const [argument] = node.arguments;
        if (!argument) return;

        const services = ESLintUtils.getParserServices(context);
        const typeChecker = services.program.getTypeChecker();
        const type = services.getTypeAtLocation(argument);

        // Check for array literal
        if (isArrayExpression(argument)) {
          context.report({ node: argument, messageId });
          return;
        }

        // Check for array type
        if (typeChecker.isArrayType(type)) {
          context.report({ node: argument, messageId });
          return;
        }

        // Check for function type
        if (type.getCallSignatures().length > 0) {
          context.report({ node: argument, messageId });
          return;
        }

        // Check for Iterable
        const iterableType = typeChecker.getIndexTypeOfType(
          type,
          ts.IndexKind.String
        );
        if (type.symbol?.getName() === 'Iterable' || iterableType) {
          context.report({ node: argument, messageId });
          return;
        }

        // Check for specific global types
        const disallowedSymbolNames = new Set([
          'Promise',
          'Date',
          'Error',
          'RegExp',
          'ArrayBuffer',
          'DataView',
          'WeakSet',
          'WeakMap',
          'Function',
        ]);

        const symbol = type.getSymbol();
        const typeName = symbol?.getName();

        if (typeName && disallowedSymbolNames.has(typeName)) {
          context.report({ node: argument, messageId });
          return;
        }
      },
    };
  },
});
