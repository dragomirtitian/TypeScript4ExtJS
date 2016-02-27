/// <reference path="../compiler/types.ts" />
/// <reference path="../compiler/plugins.ts" />
module ts {
    let orinalNodeIsMissing = ts.nodeIsMissing;
    ts.nodeIsMissing = function (node: Node): boolean{
        if (node) {
            return orinalNodeIsMissing(node) && !(node.flags & NodeFlags.PluginSynthetic);
        }
        return orinalNodeIsMissing(node);
    }

    export interface NodeLinks {
        isReflectionParameter?: boolean;
    }

    export interface ClassElement {
        extFlags: ExtFlags;
    }
    export interface MethodDeclaration {
        linkedFieldName?: string;
    }
    export interface ClassDeclaration {
        configInterfaceArgs: {
            prefix?: string;
            name?: string;
            baseInterfaceType: TypeNode;
            existingInterface?: InterfaceDeclaration;
        };
    }

    export interface PropertyDeclaration {
        propArgs: {
            setter: boolean; getter: boolean;
            existingGetter?: MethodDeclaration;
            existingSetter?: MethodDeclaration;
        };
        configArguments: {
            required: boolean;
            alternateConfigType: TypeNode;
        }
    }

    export const enum ExtFlags {
        Config = 0x04,
        ExtGetter = 0x80,
        ExtSetter = 0x100,
        EmitMember = 0x01
    }

    function createIdentifierFromName(name: ts.Identifier, prefix?: string): ts.Identifier {
        let text = name.text;
        let id = createIdentifier(prefix ? (prefix + text.substr(0, 1).toUpperCase() + text.substr(1)) : text);
        id.flags |= NodeFlags.PluginSynthetic;
        return id;
    }
    function createIdentifier(name: string): ts.Identifier {
        let id = <Identifier>createNode(SyntaxKind.Identifier);
        id.text = name;
        id.flags |= NodeFlags.PluginSynthetic;
        return id;
    }
    function copyAttributes(newNode: NodeArray<Node>, oldNode: NodeArray<Node>): void;
    function copyAttributes(newNode: Node, oldNode: Node): void;
    function copyAttributes(newNode: any, oldNode: any) : void {
        newNode.flags = oldNode.flags;
        copyPosition(newNode, oldNode);
        newNode.parserContextFlags = oldNode.parserContextFlags;
    }

    function copyPosition<T extends { flags?: NodeFlags; end: number; pos: number; }>(newNode: T, oldNode: { end: number }): T {
        newNode.end = newNode.pos = oldNode.end;
        newNode.flags |= NodeFlags.PluginSynthetic;
        return newNode;
    }

    function createNodeWithPosition<T extends Node>(kind: SyntaxKind, posNode: { end: number; pos: number; }): T {
        let node = createNode(kind);
        node.end = node.pos = posNode.end;
        node.flags |= NodeFlags.PluginSynthetic;
        return <T>node;
    }

    function createNodeArrayWithPosition<T extends Node>(posNode: { end: number; pos: number; }): NodeArray<T> {
        let node = <NodeArray<T>>[];
        node.end = node.pos = posNode.end;
        return node;
    }

    function extractArguments(decorator: Decorator) {
        function extarctValue(node: Node): any{
            if (!node) return undefined;
            switch (node.kind) {
                case SyntaxKind.ObjectLiteralExpression:
                    let objLiteral = <ObjectLiteralExpression>node;
                    let obj: { [name: string]: any } = {};
                    for (let prop of objLiteral.properties) {
                        
                        obj[(<Identifier>prop.name).text] = extarctValue((<PropertyAssignment>prop).initializer);
                    }
                    return obj
                case SyntaxKind.NumericLiteral:
                case SyntaxKind.StringLiteral:
                    return (<LiteralExpression>node).text
                case SyntaxKind.TrueKeyword:
                    return true;
                case SyntaxKind.FalseKeyword:
                    return false;
            }
        }
        let call = <CallExpression>decorator.expression;
        let argValues : any[] = [];
        for (let arg of call.arguments) {
            argValues.push(extarctValue(arg));
        }
        return argValues;
    }
    var ignoredProps: {
        [name: string]: boolean
    } = {
            symbol: true,
            jsDocComment: true,
            locals: true,
            nextContainer: true,
            localSymbol: true,
            id: true,
    }
    let depth = 0;
    function deepCloneNode<T>(node: T, parent: Node, pos: number, extraIgnoredProps?: any): T
    function deepCloneNode(node: { [name: string]: any },
        parent: Node, pos: number, extraIgnoredProps?: any): any{

        let newNode: any;
        let proto = Object.getPrototypeOf(node);
        let kind: SyntaxKind = node['kind'];
        let newParent: Node;

        Debug.assert(depth++ < 40);

        if (kind) {
            newParent = newNode = createNode(kind);
        }
        else if (node instanceof Array) {
            newNode = [];
            newParent = parent;
        }else if (proto.constructor) {
            newParent = newNode = new (proto.constructor)();
        } else {
            newNode = {};
        }
        
        for (let prop in node) {
            if (!(<Object>node).hasOwnProperty(prop)) continue;
            if (ignoredProps[prop] || prop[0] === '_') continue;
            if (ignoredProps[prop] || prop[0] === '_') continue;
            var ignoredConfig = extraIgnoredProps && extraIgnoredProps[prop];
            if (ignoredConfig === true) continue;

            if (prop === "parent") {
                newNode.parent = parent;
            }
            else if (prop === "pos" || prop === "end") {
                newNode[prop] = pos;
            }
            else if (node[prop] instanceof Object) {
                newNode[prop] = deepCloneNode(node[prop], newParent, pos, ignoredConfig);
            }
            else {
                newNode[prop] = node[prop];
            }
        }
        depth--;
        if (kind) {
            newNode['flags'] |= NodeFlags.PluginSynthetic;
        }
        return newNode;
    }

    let ConfigInterfaceHasAnUnsupportedInheritanceType: DiagnosticMessage = {
        category: DiagnosticCategory.Error,
        key: "The type of inheritence is not supported for a configInterface. Try specifing teh config ineritance explicitly.",
        message: "The type of inheritence is not supported for a configInterface. Try specifing teh config ineritance explicitly.",
        code: -1
    };
    let ConfigInterfaceHasAnUnsupportedInheritanceTypeInDecorator: DiagnosticMessage = {
        category: DiagnosticCategory.Error,
        key: "The type of inheritence is not supported for a configInterface decorator. The base type must be a qualified name.",
        message: "The type of inheritence is not supported for a configInterface decorator. The base type must be a qualified name.",
        code: -2
    };

    function configInterface(decorator: Decorator, node: ClassDeclaration) {

        function heritageClauseFromDecorator(type: TypeReferenceNode, parent: Node, errorReporter: PluginErrorReporter) {
            var exp = createNodeWithPosition<ExpressionWithTypeArguments>(SyntaxKind.ExpressionWithTypeArguments, parent);
            if (type.typeArguments) {
                exp.typeArguments = deepCloneNode(type.typeArguments, parent, parent.end);
            }

            function qualifiedNameToPropertyAccess(original: QualifiedName | Identifier): LeftHandSideExpression {
                if (original.kind === SyntaxKind.Identifier) {
                    return deepCloneNode(<Identifier>original, parent, parent.end);
                } else if (original.kind === SyntaxKind.QualifiedName) {
                    var qName: QualifiedName = <QualifiedName>original;
                    var propAcess = createNodeWithPosition<PropertyAccessExpression>(SyntaxKind.PropertyAccessExpression, parent);
                    propAcess.name = deepCloneNode(qName.right, parent, parent.end);
                    propAcess.expression = <any>qualifiedNameToPropertyAccess(<QualifiedName>qName.left);
                    if (!propAcess.expression) return null;
                } else {
                    errorReporter(type, ConfigInterfaceHasAnUnsupportedInheritanceTypeInDecorator); 
                    return null;
                }
                return propAcess;   
            }

            exp.expression = qualifiedNameToPropertyAccess(type.typeName);
            if (!exp.expression) return null;
            return exp;
        }
        
        function heritageClauseFromExisting(hClause: NodeArray<HeritageClause>, parent: Node, prefix: string, errorReporter: PluginErrorReporter): ExpressionWithTypeArguments {
            let extendTypes: NodeArray<ExpressionWithTypeArguments>;
            for (let i = 0, n = hClause.length; i < n; i++){
                if (hClause[i].token === SyntaxKind.ExtendsKeyword) {
                    extendTypes = hClause[i].types;
                }
            }

            if (!extendTypes) return null;
            var baseType = deepCloneNode(extendTypes[0], parent, parent.end);
            var typeExp = baseType.expression;
            if (typeExp.kind === SyntaxKind.Identifier) {
                baseType.expression = copyPosition(createIdentifierFromName(<Identifier>typeExp, prefix), parent);
            } else if (typeExp.kind === SyntaxKind.PropertyAccessExpression) {
                var propAccess = <PropertyAccessExpression>typeExp;
                propAccess.name = copyPosition(createIdentifierFromName(propAccess.name, prefix), parent);
            } else {
                errorReporter(extendTypes[0], ConfigInterfaceHasAnUnsupportedInheritanceType); 
                return null;
            }

            return baseType;
        }
        function parserPlugin(result: NodeArray<Declaration>, classNode: ClassDeclaration, errorReporter: PluginErrorReporter) {
            let arg = classNode.configInterfaceArgs;
            if (!classNode.name || (classNode.parserContextFlags & ParserContextFlags.ThisNodeHasError)) return;
            
            if (arg && arg.existingInterface)
            {
                result.push(arg.existingInterface);
            }

            let configInterface = <InterfaceDeclaration>createNode(SyntaxKind.InterfaceDeclaration);
            let name: string = arg.name || (arg.prefix + classNode.name.text);
            configInterface.name = copyPosition(createIdentifier(name), node);
            copyAttributes(configInterface, classNode)
            configInterface.declarationEmitterPlugin = noEmmit;

            let members = configInterface.members = copyPosition(<NodeArray<TypeElement>>[], classNode);
            let baseType: ExpressionWithTypeArguments;
            if (arg.baseInterfaceType) {
                baseType = heritageClauseFromDecorator(<TypeReferenceNode>arg.baseInterfaceType, configInterface, errorReporter);
            }
            else if (classNode.heritageClauses) {
                baseType = heritageClauseFromExisting(classNode.heritageClauses, configInterface, arg.prefix, errorReporter);
            }
            if (classNode.typeParameters) {
                configInterface.typeParameters = deepCloneNode(classNode.typeParameters, configInterface, configInterface.end);
            }
            if (baseType) {
                let hClauses = createNodeArrayWithPosition<HeritageClause>(configInterface);

                let hClause = createNodeWithPosition<HeritageClause>(SyntaxKind.HeritageClause, configInterface);
                hClauses.push(hClause);
                hClause.token = SyntaxKind.ExtendsKeyword;
                let hClauseTypes = hClause.types = createNodeArrayWithPosition<ExpressionWithTypeArguments>(configInterface);


                hClauseTypes.push(baseType);

                configInterface.heritageClauses = hClauses;
            }
            
            for (let member of classNode.members) {
                var configArguments = (<PropertyDeclaration>member).configArguments;
                if (!configArguments) continue;
                if (!member.name || (member.parserContextFlags & ParserContextFlags.ThisNodeHasError)) continue;

                let prop = <PropertyDeclaration>deepCloneNode(member, configInterface, configInterface.end, {
                    initializer: true
                });
                if (prop.configArguments.required !== true) {
                    if (prop.kind === SyntaxKind.PropertyDeclaration || prop.kind === SyntaxKind.MethodDeclaration) {
                        prop.questionToken = createNode(SyntaxKind.QuestionToken);
                        copyPosition(prop.questionToken, prop);
                        prop.questionToken.parent = prop
                    }
                }
                if (configArguments.alternateConfigType) {
                    prop.type = deepCloneNode(configArguments.alternateConfigType, prop, prop.end);
                }
                prop.decorators = undefined;
                members.push(<any>prop);
            }
            
            result.push(configInterface);
        }
        node.configInterfaceArgs = extractArguments(decorator)[0] || {};
        node.configInterfaceArgs.prefix = node.configInterfaceArgs.prefix || "I";
        if (decorator.expression.kind === SyntaxKind.CallExpression) {
            let typeArgs = (<CallExpression>decorator.expression).typeArguments;
            let typeArg = typeArgs && typeArgs[0];
            if (typeArg) {
                node.configInterfaceArgs.baseInterfaceType = typeArg;
            }
        }
        node.parserPlugin = parserPlugin;
        decorator.declarationEmitterPlugin = emitDecoratorAsIs;
    }

    function config(decorator: Decorator, node: PropertyDeclaration) {
        node.configArguments = extractArguments(decorator)[0] || {};

        if (decorator.expression.kind === SyntaxKind.CallExpression) {
            let typeArgs = (<CallExpression>decorator.expression).typeArguments;
            let typeArg = typeArgs && typeArgs[0];
            if (typeArg) {
                node.configArguments.alternateConfigType = typeArg;
            }
        }
        decorator.declarationEmitterPlugin = emitDecoratorAsIs;
        node.extFlags |= ExtFlags.Config;
    }

    function noEmmit() {
        return true;
    }

    function declarationNameToString(name: DeclarationName) {
        return (<Identifier>name).text;
    }

    function emitClassMemberPrefix(node: ClassLikeDeclaration, member: MethodDeclaration, context: PluginEmitterContext) {
        let write = context.writer.write;
        write(node.name.text);
        if (!(member.flags & NodeFlags.Static)) {
            write(".prototype");
        }
        write(".");
        write(declarationNameToString(member.name));
        write(" = ");
    }

    function createGetter(prop: PropertyDeclaration, extType: ExtFlags) {
        if (prop.propArgs.existingGetter) return prop.propArgs.existingGetter;

        let methodDeclaration = <MethodDeclaration>createNode(SyntaxKind.MethodDeclaration);
        copyAttributes(methodDeclaration, prop);
        if (prop.type) {
            methodDeclaration.type = <TypeNode>deepCloneNode(prop.type, methodDeclaration, methodDeclaration.end);
        }
        methodDeclaration.name = copyPosition(createIdentifierFromName(<Identifier>prop.name, "get"), prop);
        copyPosition(methodDeclaration, prop);
        methodDeclaration.parameters = copyPosition(<NodeArray<ParameterDeclaration>>[], prop);
        methodDeclaration.flags |= NodeFlags.Ambient;
        methodDeclaration.extFlags = ExtFlags.ExtGetter | extType;
        methodDeclaration.linkedFieldName = declarationNameToString(prop.name);
        methodDeclaration.declarationEmitterPlugin = noEmmit;
        methodDeclaration.emitterPlugin = emitGettter;

        return methodDeclaration;

        function emitGettter(node: MethodDeclaration, context: PluginEmitterContext) {
            let write = context.writer.write;
            context.writer.writeLine();

            emitClassMemberPrefix(<ClassLikeDeclaration>node.parent, node, context);

            write("function() { return this.");
            write(node.linkedFieldName);
            write("; };");
            return true;
        }
        
    }

    function createSetter(prop: PropertyDeclaration, extType: ExtFlags) {
        let methodDeclaration = <MethodDeclaration>createNode(SyntaxKind.MethodDeclaration);

        copyAttributes(methodDeclaration, prop);
        methodDeclaration.type = copyPosition(<TypeNode>createNode(SyntaxKind.VoidKeyword), prop);
        methodDeclaration.name = copyPosition(createIdentifierFromName(<Identifier>prop.name, "set"), prop);
        methodDeclaration.parameters = copyPosition(<NodeArray<ParameterDeclaration>>[], prop);
        methodDeclaration.linkedFieldName = declarationNameToString(prop.name);
        methodDeclaration.flags |= NodeFlags.Ambient;
        methodDeclaration.declarationEmitterPlugin = noEmmit;
        methodDeclaration.extFlags = ExtFlags.ExtSetter | extType;
        methodDeclaration.emitterPlugin = emitSettter


        let parameter = copyPosition(<ParameterDeclaration>createNode(SyntaxKind.Parameter), prop);
        
        if (prop.type) {
            parameter.type = deepCloneNode(prop.type, parameter, methodDeclaration.end);
        }

        parameter.name = copyPosition(createIdentifier("value"), prop);
        methodDeclaration.parameters.push(parameter);
        return methodDeclaration;

        function emitSettter(node: MethodDeclaration, context: PluginEmitterContext) {
            let write = context.writer.write;
            context.writer.writeLine();

            emitClassMemberPrefix(<ClassLikeDeclaration>node.parent, node, context);
            
            write("function(value) { return this.");
            write(node.linkedFieldName);
            write(" = value; };");
            return true;
        }
    }

    let PropertiesMustBeAccessedThroughGetterAndSetterMethods: DiagnosticMessage = {
        category: DiagnosticCategory.Error,
        message: "Properties must be accessed through getter setter methods.",
        key: "Properties must be accessed through getter setter methods.",
        code: -3
    };

    function prop(extType: ExtFlags) {
        return (function (decorator: Decorator, node: PropertyDeclaration) {
            function parserExtension(result: NodeArray<Declaration>, prop: PropertyDeclaration, reportError: PluginErrorReporter) {
                var args = prop.propArgs;
                if (!prop.name || (prop.parserContextFlags & ParserContextFlags.ThisNodeHasError)) return;
                if (args.getter !== false) result.push(createGetter(prop, extType));
                if (args.setter !== false) result.push(createSetter(prop, extType));
            }

            node.propArgs = extractArguments(decorator)[0] || {};
            node.parserPlugin = parserExtension;
            addPluginCallback(node, (node, type, error, getLinks) => {
                var parent = node.parent;
                while (parent &&
                    parent.kind != SyntaxKind.CallExpression &&
                    parent.kind != SyntaxKind.ModuleDeclaration &&
                    parent.kind != SyntaxKind.ClassDeclaration) {
                    if (getLinks(parent).isReflectionParameter) return;
                    parent = parent.parent;
                }
                error(node, PropertiesMustBeAccessedThroughGetterAndSetterMethods);
            });
            decorator.declarationEmitterPlugin = emitDecoratorAsIs;
        })
    }
    
    function createSymbolWriter(writer: EmitTextWriter): SymbolWriter{
        return {
            writeSymbol: writer.write,
            clear: noEmmit,
            decreaseIndent: writer.decreaseIndent,
            increaseIndent: writer.increaseIndent,
            trackSymbol: noEmmit,
            writeKeyword: s => s !== "typeof" && writer.write(s),
            writeLine: noEmmit,
            writeOperator: writer.write,
            writeParameter: writer.write,
            writePunctuation: writer.write,
            writeSpace: noEmmit,
            writeStringLiteral: writer.write,
            reportInaccessibleThisError: () => { },
        };
    }

    function extJsClass(decorator: Decorator, node: ClassDeclaration) {

        function emitExtJsSuperCallExpression(node: CallExpression, context: PluginEmitterContext) {
            let write = context.writer.write
            let emit = context.emit;
            write("this.callParent([");
            let arguments = node.arguments;
            if (arguments) {
                for (var i = 0, count = arguments.length; i < count; i++) {
                    if (i != 0) write(", ");
                    emit(arguments[i]);
                }
            }
            write("])");
            return true;
        }

        function emitExtNewExpression(node: NewExpression, context: PluginEmitterContext) {
            let write = context.writer.write
            let emit = context.emit;
            write("Ext.create('");
            let pos = context.writer.getTextPos();
            context.emitResolver.writeTypeOfExpression(node, null, TypeFormatFlags.UseFullyQualifiedType, createSymbolWriter(context.writer));
            let typeName = context.writer.getText().substring(pos);
            write("'");
            let arguments = node.arguments;
            if (arguments) {
                for (var i = 0, count = arguments.length; i < count; i++) {
                    write(", ");
                    emit(arguments[i]);
                }
            }
            write(")");
            return true;
        }
        function usagePlugin(node: Node) {
            let parent = node.parent;
            if (parent.kind === SyntaxKind.NewExpression && (<NewExpression>parent).expression === node) {
                parent.emitterPlugin = emitExtNewExpression;
            }
            else if (node.kind === SyntaxKind.SuperKeyword) {
                if (parent.kind === SyntaxKind.PropertyAccessExpression
                    && parent.parent.kind === SyntaxKind.CallExpression) {
                    parent.parent.emitterPlugin = emitExtJsSuperCallExpression;
                }
                else if (node.kind === SyntaxKind.SuperKeyword && node.parent.kind === SyntaxKind.CallExpression) {
                    parent.emitterPlugin = emitExtJsSuperCallExpression;
                }
            }
        }

        function emitterPlugin(node: Node, context: PluginEmitterContext) {
            let writer = context.writer;
            let write = writer.write;
            let writeLine = context.writer.writeLine;
            let increaseIndent = context.writer.increaseIndent;
            let decreaseIndent = context.writer.decreaseIndent;
            let emitStart = context.emitStart;
            let emitEnd = context.emitEnd;
            let emit = context.emit;
            let emitLeadingComments = context.emitLeadingComments;
            let emitTrailingComments = context.emitTrailingComments;
            let symbolWriter = createSymbolWriter(writer);

            emitExtJsClassDeclaration(<ClassDeclaration>node);
            //Ext Js Emit Support
            function emitExtJsClassDeclaration(node: ClassDeclaration) {

                emitLeadingComments(node);
                write("Ext.define('");
                context.emitResolver.writeTypeOfDeclaration(<any>node, null, TypeFormatFlags.UseFullyQualifiedType, symbolWriter);
                write("', ");
                write(tokenToString(SyntaxKind.OpenBraceToken));
                writeLine();
                increaseIndent();

                var needsDelimiter: boolean;

                emitStart(node);

                var baseType = node.heritageClauses && node.heritageClauses[0] && node.heritageClauses[0].types[0];

                if (baseType) {
                    writeDelimiter();
                    emitStart(baseType);
                    write("extend: '")
                    context.emitResolver.writeTypeOfExpression(<any>baseType.expression, null, TypeFormatFlags.UseFullyQualifiedType, symbolWriter);
                    write("'")
                    emitEnd(baseType);
                }

                // Emit ext config block
                emitConfigBlock("config", 0, NodeFlags.Static | NodeFlags.Ambient, ExtFlags.Config, 0);

                // Emit ext statics block 
                emitConfigBlock("statics", NodeFlags.Static, NodeFlags.Ambient, 0, 0);

                // Emit normal class mebers
                emitConfigBlock(null, 0, NodeFlags.Static | NodeFlags.Ambient, 0, ExtFlags.Config);

                // Emit generated ext getter and setter 
                emitConfigBlock(null, NodeFlags.Ambient, NodeFlags.Static, ExtFlags.ExtGetter | ExtFlags.ExtSetter, 0);

                emitConstructorOfClass();

                writeLine();

                decreaseIndent();
                writeLine();
                write(tokenToString(SyntaxKind.CloseBraceToken));
                write(");");
                emitEnd(node);

                emitTrailingComments(node);

                function writeDelimiter() {
                    if (needsDelimiter) {
                        write(",");
                        writeLine();
                    }
                    needsDelimiter = true;
                }

                function emitContructor() {
                }

                function emitMemeber(member: ClassElement) {
                    switch (member.kind) {
                        case SyntaxKind.MethodDeclaration:
                            if (member.flags & NodeFlags.Ambient) {
                                if (member.extFlags & ExtFlags.EmitMember) {
                                    if (member.extFlags & ExtFlags.ExtGetter) {
                                        emitMemberGetter(<MethodDeclaration>member);
                                    } else {
                                        emitMemberSetter(<MethodDeclaration>member);
                                    }
                                }
                            } else {
                                emit(member)
                            }
                            break;
                        case SyntaxKind.PropertyDeclaration:
                            emitMemberProperty(<PropertyDeclaration>member);
                            break;
                        default:
                            emitMemeberDefault(member);
                    }
                }

                function emitMemeberDefault(member: Declaration) {
                    write(declarationNameToString(member.name));
                    write(":undefined");
                }

                function emitMemberGetter(member: MethodDeclaration) {
                    write(declarationNameToString(member.name));
                    write(" : ");
                    emitStart(member);
                    write("function() ");
                    write("{ return this.get('");
                    write(member.linkedFieldName);
                    write("'); } ");
                    emitEnd(member)
                }

                function emitMemberSetter(member: MethodDeclaration) {
                    write(declarationNameToString(member.name));
                    write(" : ");
                    emitStart(member);
                    write("function(value) ");
                    write("{ return this.set('");
                    write(member.linkedFieldName);
                    write("', value); } ");
                    emitEnd(member)
                }

                function emitMemberProperty(member: PropertyDeclaration) {
                    write(declarationNameToString(member.name));
                    if (member.initializer) {
                        write(" : ");
                        emit(member.initializer);
                    } else {
                        write(" : null");
                    }
                }

                function emitConfigBlock(blockName: string, flags: NodeFlags, notFlags: NodeFlags, extAttributes: ExtFlags, notExtAttributes: ExtFlags) {
                    writeDelimiter();
                    if (blockName) {
                        
                        write(blockName);
                        write(" : {");
                        increaseIndent();
                        writeLine();
                    } 
                    function writeElementDelimiter() {
                        if (currentWriterPos !== writer.getTextPos()) {
                            if (blockName) {
                                write(", ");
                                writeLine();
                            } else {
                                writeDelimiter();
                            }
                        }
                    }
                    var currentWriterPos = writer.getTextPos();
                    for (var i = 0, n = node.members.length; i < n; i++) {
                        var member = <ClassElement>node.members[i];
                        if (member.kind === SyntaxKind.Constructor) continue;
                        if (flags != 0 && !(member.flags & flags)) continue;
                        if (member.flags & notFlags) continue;
                        if (extAttributes != 0 && !(member.extFlags & extAttributes)) continue;
                        if (member.extFlags & notExtAttributes) continue;

                        writeElementDelimiter();
                        currentWriterPos = writer.getTextPos();
                        emitMemeber(member);
                    }

                    if (blockName) {
                        writeLine();
                        decreaseIndent();
                        write("}");
                    } else {
                        writeElementDelimiter();
                        needsDelimiter = false;
                    }

                }

                function emitConstructorOfClass() {
                    forEach(node.members, member => {
                        if (member.kind === SyntaxKind.Constructor && !(<ConstructorDeclaration>member).body) {
                            emitLeadingComments(member);
                        }
                    });
                    var ctor = forEach(node.members, member => {
                        if (member.kind === SyntaxKind.Constructor && (<ConstructorDeclaration>member).body) {
                            return <ConstructorDeclaration>member;
                        }
                    });

                    if (ctor) {
                        writeDelimiter();
                        emitLeadingComments(ctor);
                        emitStart(ctor);
                        write("constructor: function ");
                        increaseIndent();
                        write("(");
                        if (ctor && ctor.parameters) {
                            let parameters = ctor.parameters;
                            for (let i = 0, n = parameters.length; i < n; i++) {
                                if (i != 0) write(", ");
                                emit(parameters[i]);
                            }
                        }
                        write(")");
                        decreaseIndent()
                        write(" {");
                        emitStart(node);
                        increaseIndent();
                        emitCaptureThisForNodeIfNecessary(node);
                        forEach(ctor.body.statements, s => {
                            writeLine();
                            emit(s);
                        });
                        writeLine();
                        decreaseIndent();
                        write("}");
                        emitEnd(ctor);
                        emitTrailingComments(ctor);
                        //ctor.kind = SyntaxKind.MethodDeclaration;
                        //emit(ctor);
                        //ctor.kind = SyntaxKind.Constructor;
                    }
                    function emitCaptureThisForNodeIfNecessary(node: Node): void {
                        if (context.emitResolver.getNodeCheckFlags(node) & NodeCheckFlags.CaptureThis) {
                            writeLine();
                            emitStart(node);
                            write("var _this = this;");
                            emitEnd(node);
                        }
                    }
                }
            }
            return true;
        }
        if (node.kind === SyntaxKind.ClassDeclaration) {
            addPluginCallback(node, usagePlugin);
            node.emitterPlugin = emitterPlugin;
            decorator.declarationEmitterPlugin = emitDecoratorAsIs;
        }
    }
    
    function injectTypeNames(decorator: Decorator, node: SignatureDeclaration) {
        var extraInfo: { [id: number]: Signature } = {};
        function usagePlugin(node: CallExpression, type: Signature, reportError: PluginErrorReporter) {
            if (type.target && type.target.typeParameters) {
                node.emitterPlugin = emitterPlugin;
                extraInfo[getNodeId(node)] = type;
            }
        }
        function emitterPlugin(node: CallExpression, context: PluginEmitterContext): boolean {
            if (node.expression.kind === SyntaxKind.SuperKeyword) return false;

            let write = context.writer.write
            let emit = context.emit;
            let signature = extraInfo[getNodeId(node)];

            emit(node.expression);
            let typeParameters = signature.target.typeParameters;
            let resolver = context.emitResolver;
            let symbolWriter = createSymbolWriter(context.writer);

            write("(");

            let arguments = node.arguments;
            if (arguments) {
                for (let i = 0, count = arguments.length; i < count; i++) {
                    if (i != 0) write(", ");
                    emit(arguments[i]);
                }
            }


            for (let i = 0, count = typeParameters.length; i < count; i++) {
                var resolvedType = signature.mapper(typeParameters[i]);
                if (i != 0 || (arguments && arguments.length)) write(", ");
                write("'");
                resolver.getSymbolDisplayBuilder().buildTypeDisplay(resolvedType, symbolWriter, null, TypeFormatFlags.UseFullyQualifiedType);
                write("'");
            }

            write(")");

            return true;
        }
        addPluginCallback(node, usagePlugin);
        decorator.declarationEmitterPlugin = emitDecoratorAsIs;
    }
    
    let ReflectionDecoratorMustSpecifyParameterNumber: DiagnosticMessage = {
        category: DiagnosticCategory.Error,
        key: "Reflection decorator must specify the parameter number.",
        message: "Reflection decorator must specify the parameter number.",
        code: -4
    };
    function reflection(decorator: Decorator, node: SignatureDeclaration) {
        var paramNumber = extractArguments(decorator)[0];
        function usagePlugin(node: Node, type: Signature, reportError: PluginErrorReporter, getNodeLinks: GetNodeLinks) {
            var parent = <CallExpression>node.parent;
            var param = parent.arguments && parent.arguments[paramNumber];
            if (param) {
                getNodeLinks(param).isReflectionParameter = true;
            } 
        }
        if (paramNumber) {
            addPluginCallback(node, usagePlugin);
            decorator.declarationEmitterPlugin = emitDecoratorAsIs;
        } else {
            node.parserPlugin = function (list, node, reportError) {
                reportError(node, ReflectionDecoratorMustSpecifyParameterNumber);
            };
        }
    }

    function emitDecoratorAsIs(decorator: Decorator, context: PluginDeclarationEmitterContext) {
        context.writer.writeTextOfNode(getSourceFileOfNode(decorator).text, decorator);
        context.writer.writeLine();
        return true;
    }

    ts.defaultPlugins["configInterface"] = configInterface,
    ts.defaultPlugins["extJsClass"] = extJsClass;
    ts.defaultPlugins["config"] = config;
    ts.defaultPlugins["prop"] = prop(0);
    ts.defaultPlugins["vmField"] = prop(ExtFlags.EmitMember);
    ts.defaultPlugins["modelField"] = prop(ExtFlags.EmitMember);
    ts.defaultPlugins["injectTypeNames"] = injectTypeNames;
    ts.defaultPlugins["sys.reflection"] = ts.defaultPlugins["reflection"] = reflection;
}