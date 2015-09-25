module ts {
    
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