module ts {
    export interface Node {
        /* plugins */
        parserPlugin?: (nodes: NodeArray<Node>, parsedNode: Node) => void;
        emitterPlugin?: (node: Node, context: PluginEmitterContext) => boolean;
        declarationEmitterExtension?: (node: Node, context: PluginDeclarationEmitterContext) => boolean;
    }
    export interface Declaration extends Node {
        usagePlugin?: (node: Node, typeOrSignature: Type | Signature) => void;
    }

    export interface Decorator extends Node {
        plugin: (decorator: Decorator, node: Node) => void;
    }
    export interface Symbol {
        usagePlugin?: (node: Node, typeOrSignature: Type | Signature) => void;
    }
    export interface Type {
        usagePlugin?: (node: Node, type: Type) => void;
    }
    export interface Signature {

        usagePlugin?: (node: Node, signature: Signature) => void;
    }

    export interface PluginEmitterContext {
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

    export interface PluginDeclarationEmitterContext {
        emitResolver: EmitResolver;
        writer: EmitTextWriter;
        symbolWriter: SymbolWriter;
        emit(node: Node): void;
    }
    
    export interface IPluginsLookup {
        [name: string]: (decorator: Decorator, node: Node) => void;
    }
    
    export let defaultPlugins: IPluginsLookup = {
        
    }
}