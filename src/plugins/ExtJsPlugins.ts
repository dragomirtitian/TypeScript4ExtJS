/// <reference path="Plugins.ts" />
module ts {
    
    export interface ClassElement {
        extAttributes: ExtAttributes;
    }
    export interface MethodDeclaration {
        linkedFieldName?: string;
    }
    export interface ClassDeclaration {
        configInterfaceArgs: { prefix?: string; name?: string; };
    }

    export interface PropertyDeclaration {
        propArgs: { setter: boolean; getter: boolean; noField: boolean; };
        configArguments: {
            required: boolean
        }
    }

    export interface IPluginEmitterContext {
        emitResolver: EmitResolver;
        writer: EmitTextWriter;
        emitStart(node: Node): void;
        emitEnd(node: Node): void;
        emitLeadingComments(node: Node): void;
        emitTrailingComments(node: Node): void;
        scopeEmitStart(node: Node): void;
        scopeEmitEnd(): void;
        emit(node: Node): void;
    }

    export const enum ExtAttributes {
        Config = 0x04,
        ExtGetter = 0x80,
        ExtSetter = 0x100,
    }

    function createIdentifierFromName(name: ts.Identifier, prefix?: string): ts.Identifier {
        let text = name.text;
        let id = createIdentifier(prefix ? (prefix + text.substr(0, 1).toUpperCase() + text.substr(1)) : text);
        copyAttributes(id, name);
        return id;
    }
    function createIdentifier(name: string): ts.Identifier {
        return <ts.Identifier>{
            text: name,
            flags: ts.NodeFlags.Ambient,
        };
    }
    function copyAttributes(newNode: NodeArray<Node>, oldNode: NodeArray<Node>);
    function copyAttributes(newNode: Node, oldNode: Node);
    function copyAttributes(newNode: any, oldNode: any) {
        newNode.flags = oldNode.flags;
        newNode.pos = oldNode.pos;
        newNode.end = oldNode.pos;
        newNode.parserContextFlags = oldNode.parserContextFlags;
    }

    function extractArguments(decorator: Decorator) {
        function extarctValue(node: Node) {
            switch (node.kind) {
                case SyntaxKind.ObjectLiteralExpression:
                    let objLiteral = <ObjectLiteralExpression>node;
                    let obj = {};
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
        let argValues = [];
        for (let arg of call.arguments) {
            argValues.push(extarctValue(arg));
        }
        return argValues;
    }

    function deepCloneNode<T>(node: T, parent: Node) {
        let newNode: any = node instanceof Array ? [] : {};
        newNode.__proto__ = (<any>node).__proto__;
        for (let prop in node) {
            if (!(<Object>node).hasOwnProperty(prop)) continue;

            if (prop === "parent") {
                newNode.parent = parent;
            }
            else if (node[prop] instanceof Object) {
                newNode[prop] = deepCloneNode(node[prop], newNode);
            }
            else {
                newNode[prop] = node[prop];
            }
        }

        return newNode;
    }
    let emptyArg = {};

    function configInterface(decorator: Decorator, node: ClassDeclaration) {
        function parserPlugin(result: NodeArray<Declaration>, classNode: ClassDeclaration) {
            let configInterface = <InterfaceDeclaration>new (getNodeConstructor(SyntaxKind.InterfaceDeclaration))();
            let arg: { prefix?: string; name?: string; } = classNode.configInterfaceArgs;
            let name: string = arg.name || ((arg.prefix || "I") + classNode.name.text);
            configInterface.name = createIdentifier(name);
            configInterface.declarationEmitterExtension = noEmmit;
            let members = configInterface.members = <NodeArray<Declaration>>[];
            copyAttributes(configInterface, classNode);
            copyAttributes(configInterface.members, classNode.members);
            for (let member of classNode.members) {
                if (!(<PropertyDeclaration>member).configArguments) continue;

                let prop = <PropertyDeclaration>deepCloneNode(member, configInterface);
                if (prop.configArguments.required !== true) {
                    prop.questionToken = new (getNodeConstructor(SyntaxKind.QuestionToken));
                }
                prop.decorators = undefined;
                members.push(prop);
            }
            result.push(configInterface);
        }
        node.configInterfaceArgs = extractArguments(decorator)[0] || emptyArg;
        node.parserPlugin = parserPlugin;
    }

    function config(decorator: Decorator, node: PropertyDeclaration) {
        node.configArguments = extractArguments(decorator)[0];
        node.extAttributes |= ExtAttributes.Config;
    }

    function noEmmit() {
        return true;
    }

    function declarationNameToString(name: DeclarationName) {
        return (<Identifier>name).text;
    }

    function createGetter(prop: PropertyDeclaration) {
        let methodDeclaration = <MethodDeclaration>new (getNodeConstructor(SyntaxKind.MethodDeclaration))();
        if (prop.type) {
            methodDeclaration.type = <TypeNode>deepCloneNode(prop.type, methodDeclaration);
        }
        methodDeclaration.name = createIdentifierFromName(<Identifier>prop.name, "get");
        methodDeclaration.parameters = <NodeArray<ParameterDeclaration>>[];
        methodDeclaration.flags |= NodeFlags.Ambient;
        methodDeclaration.extAttributes = ExtAttributes.ExtGetter;
        methodDeclaration.linkedFieldName = declarationNameToString(prop.name);
        methodDeclaration.declarationEmitterExtension = noEmmit;

        return methodDeclaration;
    }

    function createSetter(prop: PropertyDeclaration) {
        let methodDeclaration = <MethodDeclaration>new (getNodeConstructor(SyntaxKind.MethodDeclaration))();

        methodDeclaration.type = <TypeNode>new (getNodeConstructor(SyntaxKind.VoidKeyword))();
        methodDeclaration.name = createIdentifierFromName(<Identifier>prop.name, "set")
        methodDeclaration.parameters = <NodeArray<ParameterDeclaration>>[];
        methodDeclaration.linkedFieldName = declarationNameToString(prop.name);
        methodDeclaration.flags |= NodeFlags.Ambient;
        methodDeclaration.declarationEmitterExtension = noEmmit;
        methodDeclaration.extAttributes = ExtAttributes.ExtSetter;

        let parameter = <ParameterDeclaration>new (getNodeConstructor(SyntaxKind.Parameter))();
        if (prop.type) {
            parameter.type = deepCloneNode(prop.type, parameter);
        }

        parameter.name = createIdentifier("value");
        methodDeclaration.parameters.push(parameter);
        return methodDeclaration;
    }

    function prop(decorator: Decorator, node: PropertyDeclaration) {
        function parserExtension(result: NodeArray<Declaration>, prop: PropertyDeclaration) {
            var args = prop.propArgs;
            if (args.noField === true) result.pop();
            if (args.getter !== false) result.push(createGetter(prop));
            if (args.setter !== false) result.push(createSetter(prop));
        }
        node.propArgs = extractArguments(decorator)[0] || emptyArg;
        node.parserPlugin = parserExtension;
    }
    
    function createSymbolWriter(writer: EmitTextWriter): SymbolWriter{
        return {
            writeSymbol: writer.write,
            clear: noEmmit,
            decreaseIndent: writer.decreaseIndent,
            increaseIndent: writer.increaseIndent,
            trackSymbol: noEmmit,
            writeKeyword: s => s !== "typeof" && writer.write(s),
            writeLine: writer.writeLine,
            writeOperator: writer.write,
            writeParameter: writer.write,
            writePunctuation: writer.write,
            writeSpace: noEmmit,
            writeStringLiteral: writer.write
        };
    }

    function extJsClass(decorator: Decorator, node: ClassDeclaration) {

        function emitExtJsSuperCallExpression(node: CallExpression, context: IPluginEmitterContext) {
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

        function emitExtNewExpression(node: NewExpression, context: IPluginEmitterContext) {
            let write = context.writer.write
            let emit = context.emit;
            write("Ext.create('");
            context.emitResolver.writeTypeOfExpression(node, null, TypeFormatFlags.UseFullyQualifiedType, createSymbolWriter(context.writer));
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
            if (node.parent.kind == SyntaxKind.NewExpression) {
                node.parent.emitterPlugin = emitExtNewExpression;
            }
            else if (node.kind == SyntaxKind.SuperKeyword) {
                if (node.parent.kind == SyntaxKind.PropertyAccessExpression
                    && node.parent.parent.kind == SyntaxKind.CallExpression) {
                    node.parent.parent.emitterPlugin = emitExtJsSuperCallExpression;
                }
                else if (node.kind == SyntaxKind.SuperKeyword && node.parent.kind == SyntaxKind.CallExpression) {
                    node.parent.emitterPlugin = emitExtJsSuperCallExpression;
                }
            }
        }

        function emitterPlugin(node: Node, context: IPluginEmitterContext) {
            let writer = context.writer;
            let write = writer.write;
            let writeLine = context.writer.writeLine;
            let increaseIndent = context.writer.increaseIndent;
            let decreaseIndent = context.writer.decreaseIndent;
            let emitStart = context.emitStart;
            let emitEnd = context.emitEnd;
            let emit = context.emit;
            let emitLeadingComments = context.emitLeadingComments;
            let scopeEmitStart = context.scopeEmitStart;
            let scopeEmitEnd = context.scopeEmitEnd;
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

                scopeEmitStart(node);

                var baseType = node.heritageClauses && node.heritageClauses[0] && node.heritageClauses[0].types[0];

                if (baseType) {
                    writeLine();
                    emitStart(baseType);
                    write("extend: '")
                    context.emitResolver.writeTypeOfExpression(<any>baseType.expression, null, TypeFormatFlags.UseFullyQualifiedType, symbolWriter);
                    write("'")
                    emitEnd(baseType);
                    writeDelimiter();
                }

                // Emit ext config block
                emitConfigBlock("config", 0, NodeFlags.Static | NodeFlags.Ambient, ExtAttributes.Config, 0);

                // Emit ext statics block 
                emitConfigBlock("statics", NodeFlags.Static, NodeFlags.Ambient, 0, 0);

                // Emit normal class mebers
                emitConfigBlock(null, 0, NodeFlags.Static | NodeFlags.Ambient, 0, ExtAttributes.Config);

                // Emit generated ext getter and setter 
                emitConfigBlock(null, NodeFlags.Ambient, NodeFlags.Static, ExtAttributes.ExtGetter | ExtAttributes.ExtSetter, 0);

                emitConstructorOfClass();

                writeLine();

                decreaseIndent();
                writeLine();
                write(tokenToString(SyntaxKind.CloseBraceToken));
                write(");");
                scopeEmitEnd();

                emitTrailingComments(node);

                function writeDelimiter() {
                    write(",");
                    writeLine();
                }

                function emitMemeber(member: ClassElement) {
                    switch (member.kind) {
                        case SyntaxKind.MethodDeclaration:
                            if (member.flags & NodeFlags.Ambient) {
                                if (member.extAttributes & ExtAttributes.ExtGetter) {
                                    emitMemberGetter(<MethodDeclaration>member);
                                } else {
                                    emitMemberSetter(<MethodDeclaration>member);
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

                function emitConfigBlock(blockName: string, flags: NodeFlags, notFlags: NodeFlags, extAttributes: ExtAttributes, notExtAttributes: ExtAttributes) {

                    if (blockName) {
                        write(blockName);
                        write(" : {");
                        increaseIndent();
                        writeLine();
                    }

                    var currentWriterPos = writer.getTextPos();
                    var hasContent = false;
                    for (var i = 0, n = node.members.length; i < n; i++) {
                        var member = <ClassElement>node.members[i];
                        if (member.kind == SyntaxKind.Constructor) continue;
                        if (flags != 0 && !(member.flags & flags)) continue;
                        if (member.flags & notFlags) continue;
                        if (extAttributes != 0 && !(member.extAttributes & extAttributes)) continue;
                        if (member.extAttributes & notExtAttributes) continue;

                        if (currentWriterPos !== writer.getTextPos()) {
                            write(", ");
                            writeLine();
                        }
                        currentWriterPos = writer.getTextPos();
                        emitMemeber(member);
                        hasContent = true;
                    }

                    if (blockName) {
                        writeLine();
                        decreaseIndent();
                        write("}");
                        writeDelimiter();
                    } else if (hasContent) {
                        writeDelimiter();
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
                        write("constructor ");
                        ctor.kind = SyntaxKind.MethodDeclaration;
                        emit(ctor);
                        ctor.kind = SyntaxKind.Constructor;
                    }
                }
            }
            return true;
        }
         
        node.usagePlugin = usagePlugin;
        node.emitterPlugin = emitterPlugin;
    }
    
    function injectTypeNames(decorator: Decorator, node: SignatureDeclaration) {
        var extraInfo: { [id: number]: Signature } = {};
        function usagePlugin(node: CallExpression, type: Signature) {
            if (type.target && type.target.typeParameters) {
                node.emitterPlugin = emitterPlugin;
                extraInfo[getNodeId(node)] = type;
            }
        }
        function emitterPlugin(node: CallExpression, context: IPluginEmitterContext): boolean {
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
        node.usagePlugin = usagePlugin;
    }

    ts.defaultPlugins["ConfigInterface"] = configInterface,
    ts.defaultPlugins["ExtJsClass"] = extJsClass;
    ts.defaultPlugins["config"] = config;
    ts.defaultPlugins["prop"] = prop;
    ts.defaultPlugins["vmField"] = prop;
    ts.defaultPlugins["modelField"] = prop;
    ts.defaultPlugins["injectTypeNames"] = injectTypeNames;
}