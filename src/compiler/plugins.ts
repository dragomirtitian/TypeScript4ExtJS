module ts {
    /* @internal */ export type PluginDiagnosticReporter = (location: Node, message: DiagnosticMessage, arg0?: any, arg1?: any, arg2?: any) => void;
    /* @internal */ export type GetNodeLinks = (node: Node) => NodeLinks;
    /* @internal */ export type UsagePluginCallback = (node: Node, typeOrSignature: Type | Signature | Symbol, reportError: PluginDiagnosticReporter, getNodeLinks: GetNodeLinks) => void;
    /* @internal */ export type UsagePlugin = UsagePluginCallback[];

    /* @internal */
    export interface Node {
        /* plugins */
        parserPlugin?: (nodes: NodeArray<Node>, parsedNode: Node, reportError: PluginDiagnosticReporter) => void;
        emitterPlugin?: (node: Node, context: PluginEmitterContext) => boolean;
        declarationEmitterPlugin?: (node: Node, context: PluginDeclarationEmitterContext) => boolean;
    }

    /* @internal */
    export function addPluginCallback<T extends { usagePlugins?: UsagePlugin }>(target: T, callback: UsagePluginCallback) {
        addPlugins(target, [callback]);
    }
    /* @internal */
    export function addPlugins<T extends { usagePlugins?: UsagePlugin }>(target: T, plugin: UsagePlugin) {
        if (target.usagePlugins) {
            target.usagePlugins.push.apply(target.usagePlugins, plugin);
        } else {
            target.usagePlugins = plugin.slice(0);
        }
    }

    /* @internal */
    export function invokePlugins(plugins: UsagePlugin, node: Node, typeOrSignature: Type | Signature | Symbol, reportError: PluginDiagnosticReporter, getNodeLinks: GetNodeLinks) {
        for (let p of plugins) {
            p(node, typeOrSignature, reportError, getNodeLinks);
        }
    }

    /* @internal */
    export interface Declaration extends Node {
        usagePlugins?: UsagePlugin;
    }
    /* @internal */
    export interface Decorator extends Node {
        plugin: (decorator: Decorator, node: Node) => void;
    }

    /* @internal */
    export interface Symbol {
        usagePlugins?: UsagePlugin;
    }

    /* @internal */
    export interface Type {
        usagePlugins?: UsagePlugin;
    }

    /* @internal */
    export interface Signature {

        usagePlugins?: UsagePlugin;
    }

    /* @internal */
    export interface PluginEmitterContext {
        emitResolver: EmitResolver;
        writer: EmitTextWriter;
        emitStart(node: Node): void;
        emitEnd(node: Node): void;
        emitLeadingComments(node: Node): void;
        emitTrailingComments(node: Node): void;
        emit(node: Node): void;
    }

    /* @internal */
    export interface PluginDeclarationEmitterContext {
        emitResolver: EmitResolver;
        writer: EmitTextWriter;
        symbolWriter: SymbolWriter;
        emit(node: Node): void;
    }

    /* @internal */
    export interface IPluginsLookup {
        [name: string]: (decorator: Decorator, node: Node) => void;
    }

    /* @internal */
    export let defaultPlugins: IPluginsLookup = {

    }
}