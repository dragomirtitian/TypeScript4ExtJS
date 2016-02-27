/// <reference path="fourslash.ts" />

//// @extJsClass()
//// @configInterface()
//// export class ExtClass {
////     /*props*/
////     @prop() @config() public prop: string;
////     @config({ required: true }) public requireConfig: string[];
////     constructor(c: IExtClass) {
////         this./*1*//*2*/
////     }
//// }

goTo.marker('1');
verify.completionListContains("getProp");
verify.completionListContains("setProp");

edit.insert("getProp(c.");
verify.completionListContains("prop");


goTo.marker('props');
edit.insertLine("@config() public addedProp: string");
goTo.marker('2');
verify.completionListContains("addedProp");