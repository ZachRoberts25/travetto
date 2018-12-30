import { TransformUtil, TransformerState } from '@travetto/compiler';

const APPLICATION = TransformUtil.buildImportAliasMap({
  '@travetto/di': ['Application']
});

function readType(node: ts.TypeNode) {
  const kind = node!.kind;
  let type: string;

  switch (kind) {
    case ts.SyntaxKind.BooleanKeyword:
    case ts.SyntaxKind.TrueKeyword:
    case ts.SyntaxKind.FalseKeyword:
      type = 'boolean';
      break;
    case ts.SyntaxKind.NumberKeyword:
    case ts.SyntaxKind.NumericLiteral:
      type = 'number';
      break;
    case ts.SyntaxKind.StringKeyword:
    case ts.SyntaxKind.StringLiteral:
    default:
      type = 'string';
      break;
  }
  return type;
}

function visitNode<T extends ts.Node>(context: ts.TransformationContext, node: T, state: TransformerState): T {
  if (ts.isClassDeclaration(node)) { // Class declaration
    const foundDec = TransformUtil.findAnyDecorator(state, node, APPLICATION);

    if (foundDec && ts.isCallExpression(foundDec.expression)) { // Constructor
      const runMethod = node.members
        .filter(x => ts.isMethodDeclaration(x))
        .filter(x => x.name!.getText() === 'run')[0];

      if (runMethod && ts.isMethodDeclaration(runMethod)) {
        const outParams = runMethod.parameters.map(p => {
          const name = p.name.getText();
          const def = p.initializer && ts.isLiteralExpression(p.initializer) ? p.initializer.text : undefined;
          const typeNode = p.type || p.initializer;

          let type;
          let subtype;
          let meta;

          if (typeNode) {
            if (p.type && ts.isUnionTypeNode(p.type)) {
              const literals = p.type.types.map(x => (x as ts.LiteralTypeNode).literal);
              type = readType(p.type.types[0]);
              subtype = 'choice';
              meta = literals.map(x => {
                const val = x.getText();
                return ts.isStringLiteral(x) ? val.substring(1, val.length - 1) : val;
              });
            } else {
              type = readType(typeNode as ts.TypeNode);
              if (type === 'string' && /file/.test(name)) {
                subtype = 'file';
              }
            }
          } else {
            type = 'string';
          }

          return { name, def, type, subtype, meta };
        });

        foundDec.expression.arguments = ts.createNodeArray([
          ...foundDec.expression.arguments,
          TransformUtil.fromLiteral({ params: outParams })
        ]);

        const decls = node.decorators;
        const ret = ts.updateClassDeclaration(node,
          decls,
          node.modifiers,
          node.name,
          node.typeParameters,
          ts.createNodeArray(node.heritageClauses),
          node.members
        ) as any;

        ret.parent = node.parent;

        for (const el of ret.members) {
          if (!el.parent) {
            el.parent = node;
          }
        }

        return ret;
      }
    }
    return node;
  } else if (ts.isFunctionDeclaration(node)) {
    return node;
  }
  return ts.visitEachChild(node, c => visitNode(context, c, state), context);
}

export const InjectableTransformer = {
  transformer: TransformUtil.importingVisitor(() => ({}), visitNode),
  key: 'application',
  after: 'injectable',
  phase: 'before'
};