/// <reference path="fourslash.ts" />

// @experimentalDecorators: true

//// declare function extJsClass(): ClassDecorator;
//// declare function configInterface<TBase>(args?: { prefix?: string; name?: string; extends: string; }): ClassDecorator;
//// declare function prop(): PropertyDecorator;
//// declare function config(args?: { required?: boolean }): PropertyDecorator;
//// declare function injectTypeNames(): any;
//// 
//// module Test3 {
////     @extJsClass()
////     @configInterface()
////     export class BaseExtClass {
////         @config({ required: true }) public requireBaseConfig: string[];
//// 
////         constructor(c: IBaseExtClass) {
////         }
////     }
//// 
////     @extJsClass()
////     @configInterface()
////     export class ExtClass extends BaseExtClass {
////         @prop() @config() public prop: BaseExtClass[];
////         @config({ required: true }) public requireConfig: string[];
//// 
////         constructor(c: IExtClass) {
////             super(c);
////             this.setProp(c.prop);
////             this.getProp();
////         }
////     }
//// 
////     var cfg: IExtClass = {
////         requireConfig: ["D", ""],
////         prop: [
////             new BaseExtClass(null)
////         ],
////         requireBaseConfig: ["1", "2"],
////     };
//// }

verify.numberOfErrorsInCurrentFile(0);




