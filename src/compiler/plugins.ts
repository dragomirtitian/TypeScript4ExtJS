module ts {
    /* @internal */ export type PluginDiagnosticReporter = (location: Node, message: DiagnosticMessage, arg0?: any, arg1?: any, arg2?: any) => void;
    /* @internal */ export type GetNodeLinks = (node: Node) => NodeLinks;
    /* @internal */ export type UsagePluginCallback = (node: Node, typeOrSignature: Type | Signature | Symbol, reportError: PluginDiagnosticReporter, getNodeLinks: GetNodeLinks) => void;
    /* @internal */ export type UsagePlugins = UsagePluginCallback[];

    /* @internal */
    export interface Node {
        /* plugins */
        parserPlugin?: (nodes: NodeArray<Node>, parsedNode: Node, reportError: PluginDiagnosticReporter) => void;
        emitterPlugin?: (node: Node, context: PluginEmitterContext) => boolean;
        declarationEmitterPlugin?: (node: Node, context: PluginDeclarationEmitterContext) => boolean;
    }

    /* @internal */
    export function addPluginCallback<T extends { usagePlugins?: UsagePlugins }>(target: T, callback: UsagePluginCallback) {
        addPlugins(target, [callback]);
    }
    /* @internal */
    export function addPlugins<T extends { usagePlugins?: UsagePlugins }>(target: T, plugin: UsagePlugins) {
        if (target.usagePlugins !== undefined) {
            target.usagePlugins.push.apply(target.usagePlugins, plugin);
        } else {
            target.usagePlugins = plugin.slice(0);
        }
    }

    /* @internal */
    export function invokePlugins(plugins: UsagePlugins, node: Node, typeOrSignature: Type | Signature | Symbol, reportError: PluginDiagnosticReporter, getNodeLinks: GetNodeLinks) {
        for (let p of plugins) {
            try {
                p(node, typeOrSignature, reportError, getNodeLinks);
            } catch (e) {
                reportError(node, Diagnostics.Plugin_invocation_failed_Exception_0, extractMessageFromException(e));
            }
        }
    }

    /* @internal */
    export interface Declaration extends Node {
        usagePlugins?: UsagePlugins;
    }
    /* @internal */
    export interface Decorator extends Node {
        plugin: (decorator: Decorator, node: Node) => void;
    }

    /* @internal */
    export interface Symbol {
        usagePlugins?: UsagePlugins;
    }

    /* @internal */
    export interface Type {
        usagePlugins?: UsagePlugins;
    }

    /* @internal */
    export interface Signature {

        usagePlugins?: UsagePlugins;
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
    export let defaultPlugins: IPluginsLookup;
    /**
     * Created the default set of plugins. By default no plugins are specified, but custom compiler builds can create a set of deafult plugins.
     */
    export function createDefaultPlugins(): IPluginsLookup{
        return {};
    }

    /**
     * The currently loaded plugin modules. If the module has already been loaded it will be cached here and it will not be reloaded;
     */
    export let pluginModules: { [fileName: string]: (mts: any, moduleFileName: string) => void };
    pluginModules = pluginModules || {};
    
    /*@internal*/
    export function extractMessageFromException(e: any) {
        return e.message || e.messageText || e.toString();
    }
    /*@internal*/
    export function loadPluginModule(moduleFileName: string,
        host: CompilerHost,
        reader: (file: string) => string,
        sysLoader: (content: string, moduleFileName: string) => (mts: any, moduleFileName: string, host: CompilerHost) => void) {

        moduleFileName = normalizePath(moduleFileName);
        let module: (mts: any, moduleFileName: string, host: CompilerHost) => void = pluginModules[moduleFileName];
        
        try {
            if (!module) {
                let content = reader(moduleFileName);
                if (content === undefined) throw createCompilerDiagnostic(Diagnostics.File_0_not_found, moduleFileName);
                if (content.charCodeAt(0) === 0xFEFF) {
                    content = content.slice(1);
                }
                content = "(function(ts, moduleFileName, host) { " + content + ` 
})`;
                module = sysLoader(content, moduleFileName);
            }
            module(ts, moduleFileName, host);
        }
        catch (m) {
            const messageText = extractMessageFromException(m);
            throw createCompilerDiagnostic(Diagnostics.Module_0_could_not_be_loaded_Exception_1, moduleFileName, messageText);
        }
    }

    /*@internal*/
    export function evalPluginModuleLoader(content: string, moduleFileName: string): (mts: typeof ts, moduleFileName: string, host: CompilerHost) => void {
        const module = eval(content);
        return module;
    }
}