/// <reference path="fourslash.ts" />

// @experimentalDecorators: true

//// declare function extJsClass(): ClassDecorator;
//// declare function configInterface<TBase>(args?: { prefix?: string; name?: string; extends: string; }): ClassDecorator;
//// declare function prop(): PropertyDecorator;
//// declare function config(args?: { required?: boolean }): PropertyDecorator;
//// declare function injectTypeNames(): any;
//// 
//// module Test {
////     @extJsClass()
////     @configInterface()
////     export class ExtClass {
////         @config({ required: true }) public requireConfig: string[];
////         constructor(c: IExtClass) {
////         }
////     }
//// 
////     var cfg: IExtClass = {
////         requireConfig: ["D", ""],
////     }
////     var o = new ExtClass(cfg); /*1*/
//// }

goTo.marker('1');
edit.insertLine("    ");
verify.numberOfErrorsInCurrentFile(0);
edit.insertLine("    ");
verify.numberOfErrorsInCurrentFile(0);

format.document();
edit.insertLine(`
    var o2 = new ExtClass({
        `);
verify.completionListContains("requireConfig");
edit.insertLine(`
        requireConfig : [ 'A' ] 
    });
`);
format.document();
verify.numberOfErrorsInCurrentFile(0);




