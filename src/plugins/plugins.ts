module ts {
    export interface IPluginsLookup {
        [name: string]: (decorator: Decorator, node: Node) => void;
    }
    
    export let defaultPlugins: IPluginsLookup = {
        
    }
}