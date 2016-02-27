/// <reference path="fourslash.ts" />

// @experimentalDecorators: true

// Filename: decl.ts
//// declare function extJsClass(): ClassDecorator;
//// declare function configInterface<TBase>(args?: { prefix?: string; name?: string; extends: string; }): ClassDecorator;
//// declare function prop(): PropertyDecorator;
//// declare function config(args?: { required?: boolean }): PropertyDecorator;
//// declare function injectTypeNames(): any;

// Filename:  main.ts
//// module Test3 {
////     @configInterface()
////     export class PropClass {
////         @config() public prop: string;
////     }
////     /*1*/
//// }

goTo.bof()
edit.insertLine('// <reference path="decl.ts" />');

goTo.marker("1");

edit.insertLine("var x: IPropClass = {};");
verify.numberOfErrorsInCurrentFile(0);




