import * as ts from 'typescript';
import * as Lint from 'tslint';

export class Rule extends Lint.Rules.TypedRule {

  public static metadata: Lint.IRuleMetadata = {
    ruleName: 'verify-model-query',
    description: 'When creating a query with @travetto/model, this rule will verify the query matches the object structure',
    optionsDescription: 'Not configurable.',
    options: null,
    optionExamples: [true],
    type: 'functionality',
    typescriptOnly: true,
    requiresTypeInfo: true,
  };

  public applyWithProgram(sourceFile: ts.SourceFile, program: ts.Program): Lint.RuleFailure[] {
    return this.applyWithFunction(sourceFile, (ctx: Lint.WalkContext<void>, tc: ts.TypeChecker) => {
      return new QueryHandler(ctx, tc).visitNode(ctx.sourceFile);
    }, undefined, program.getTypeChecker());
  }
}

class QueryHandler {

  static QUERY_TYPES = [
    'Query', 'ModelQuery', 'PageableModelQuery'
  ].reduce((acc, v) => { acc[v] = true; return acc; }, {} as { [key: string]: boolean });

  cache = new Map<any, Map<string, ts.Symbol>>();

  constructor(private ctx: Lint.WalkContext<void>, private tc: ts.TypeChecker) {
    this.visitNode = this.visitNode.bind(this);
  }


  getMembersByType(type: ts.Type) {
    if (!this.cache.has(type)) {
      let members = new Map<string, ts.Symbol>();
      for (let symbol of this.tc.getPropertiesOfType(type)) {
        members.set(`${symbol.escapedName}`, symbol);
      }
      this.cache.set(type, members);
    }
    return this.cache.get(type)!;
  }

  visitNode(node: ts.Node): void {
    // sHandle direct invocation
    if (ts.isPropertyDeclaration(node) && node.initializer) {
      this.processQuery(this.tc.getTypeAtLocation(node), node.initializer);
    } else if (ts.isCallExpression(node)) {
      let sig = this.tc.getResolvedSignature(node);
      if (sig) {
        let i = 0;
        for (let n of sig.parameters) {
          this.processQuery((n as any).type, node.arguments[i]);
          i++;
        }
      }
    } else if (ts.isVariableDeclaration(node) && node.initializer) {
      this.processQuery(this.tc.getTypeAtLocation(node), node.initializer);
    }
    return ts.forEachChild(node, this.visitNode);
  }


  processSelectClause(node: ts.Node, model: ts.Type, member: ts.Type) {
    console.log('Select', model, member);
  }


  processWhereClause(node: ts.Node, model: ts.Type, passed: ts.Type) {
    let passedMembers: Map<string, ts.Symbol> = this.getMembersByType(passed);
    let modelMembers: Map<string, ts.Symbol> = this.getMembersByType(model);

    for (let [passedMemberKey, passedMemberSymbol] of passedMembers.entries()) {

      let passedMemberType = (passedMemberSymbol as any).type as ts.Type;
      let passedMemberTypeNode = passedMemberSymbol.valueDeclaration!;

      if (passedMemberKey.charAt(0) === '$') {
        if (passedMembers.size > 1) {
          // Error
        }
        let n: ts.Node = (passedMemberSymbol.valueDeclaration! as any).initializer;

        if (passedMemberKey === '$and' || passedMemberKey === '$or') {
          if (this.checkIfArrayType(n)) {
            if (ts.isTypeReferenceNode(n)) {
              // bail on deep dive on variables
              continue;
            }
            // Iterate
            let arr = n as ts.ArrayLiteralExpression;
            for (let el of arr.elements) {
              this.processWhereClause(el, model, passedMemberType);
            }
          } else {
            this.ctx.addFailureAtNode(n, `${passedMemberKey} requires the value to be an array`);
          }
        } else if (passedMemberKey === '$not') {
          // Not loop
          if (this.checkIfObjectType(n)) {
            if (ts.isTypeReferenceNode(n)) {
              // bail on deep dive on variables
              continue;
            }

            this.processWhereClause(node, model, passedMemberType);
          } else {
            this.ctx.addFailureAtNode(n, `${passedMemberKey} requires the value to be an object`);
          }
        } else {
          // Error
        }
      } else {
        let modelMemberSymbol = modelMembers.get(passedMemberKey);
        if (!modelMemberSymbol) {
          this.ctx.addFailureAtNode(node, `Unknown member ${passedMemberKey}`);
        } else {
          let modelMemberTypeNode: ts.TypeNode = (modelMemberSymbol.valueDeclaration! as any).type;
          let modelMemberType: ts.Type = this.tc.getTypeFromTypeNode(modelMemberTypeNode);
          let modelMemberKind: ts.SyntaxKind = modelMemberTypeNode.kind;

          if (modelMemberKind === ts.SyntaxKind.StringKeyword) {
            this.checkOperatorClause(passedMemberTypeNode, passedMemberType, ts.TypeFlags.String, { $ne: 'string', $eq: 'string', $exists: 'string' });
          } else if (modelMemberKind === ts.SyntaxKind.NumberKeyword) {
            this.checkOperatorClause(passedMemberTypeNode, passedMemberType, ts.TypeFlags.Number,
              { $ne: 'number', $eq: 'number', $exists: 'number', $lt: 'number', $gt: 'number', $lte: 'number', $gte: 'number' });
          } else if (modelMemberKind === ts.SyntaxKind.BooleanKeyword) {
            this.checkOperatorClause(passedMemberTypeNode, passedMemberType, ts.TypeFlags.Boolean, { $ne: 'boolean', $eq: 'boolean', $exists: 'boolean' });
          } else if (modelMemberKind === ts.SyntaxKind.ArrayType) {
            //if ()
          } else if (modelMemberKind === ts.SyntaxKind.TypeReference) {
            if (modelMemberType.symbol!.escapedName === 'Date') {
              console.log('Got a date!');
              this.checkOperatorClause(passedMemberTypeNode, passedMemberType, 'Date',
                { $ne: 'Date', $eq: 'Date', $exists: 'Date', $lt: 'Date', $gt: 'Date', $lte: 'Date', $gte: 'Date' });
            } else {
              this.processWhereClause(passedMemberTypeNode, modelMemberType, passedMemberType);
            }
          }
        }
      }
    }
  }

  checkIfArrayType(n: ts.Node) {
    let type = this.tc.getTypeAtLocation(n);
    return ts.isArrayLiteralExpression(n) || ts.isArrayTypeNode(n) || type.symbol!.escapedName === 'Array';
  }

  checkIfObjectType(n: ts.Node) {
    let type = this.tc.getTypeAtLocation(n);
    return ts.isObjectLiteralExpression(n) || (type.flags & ts.TypeFlags.Object) > 0 && type.symbol!.escapedName !== 'Array';
  }


  checkOperatorClause(target: ts.Node, type: ts.Type, primitiveType: ts.TypeFlags | string, allowed: { [key: string]: string }) {
    if ((type.flags & ts.TypeFlags.Object) === 0) {
      if (typeof primitiveType === 'number') {
        if ((type.flags & primitiveType) === 0) {
          this.ctx.addFailureAtNode(target, `Operator clause only supports types of ${ts.TypeFlags[primitiveType].toLowerCase()}, not ${this.tc.typeToString(type)}`);
        }
      } else {
        let primitiveString = this.tc.typeToString(type);
        if (primitiveType !== primitiveString) {
          this.ctx.addFailureAtNode(target, `Operator clause only supports types of ${primitiveType}, not ${primitiveString}`);
        }
      }
      return;
    }

    let members = this.getMembersByType(type);
    if (members.size !== 1) {
      this.ctx.addFailureAtNode(target, `One and only one operation may be specified in an operator clause`);
    }
    let [key, value] = members.entries().next().value;
    let passedType = (value as any).type as ts.Type;

    if (!(key in allowed)) {
      this.ctx.addFailureAtNode(target, `Operation ${key}, not allowed for field of type ${this.tc.typeToString(passedType)}`);
    } else {
      let passedTypeName = this.tc.typeToString(passedType);
      if (passedTypeName !== allowed[key]) {
        this.ctx.addFailureAtNode(target, `Passed in value ${passedTypeName} mismatches with expected type ${allowed[key]}`);
      }
    }
  }

  processGroupByClause(node: ts.Node, model: ts.Type, member: ts.Type) {

  }

  processSortClause(node: ts.Node, model: ts.Type, member: ts.Type) {

  }

  processQuery(queryType: ts.Type, passedNode: ts.Node) {
    if (queryType && queryType.aliasSymbol) {
      let queryName = `${queryType.aliasSymbol.escapedName}`;

      if (QueryHandler.QUERY_TYPES[queryName] && queryType.aliasTypeArguments && queryType.aliasTypeArguments.length) {
        let modelType = queryType.aliasTypeArguments[0];

        let members = this.getMembersByType(queryType)

        if (members && members.size) {
          let passedType = this.tc.getTypeAtLocation(passedNode);
          let passedMembers = this.getMembersByType(passedType);
          for (let k of ['select', 'where', 'groupBy', 'sort']) {
            if (members.has(k) && passedMembers.has(k)) {
              (this as any)[`process${k.charAt(0).toUpperCase()}${k.substring(1)}Clause`](passedNode, modelType, (passedMembers.get(k)! as any).type);
            }
          }
        }
      }
    }
  }
}