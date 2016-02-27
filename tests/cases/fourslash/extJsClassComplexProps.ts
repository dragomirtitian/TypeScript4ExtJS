/// <reference path="fourslash.ts" />

//// interface Generic<T> { }
//// @extJsClass()
//// @configInterface()
//// export class ExtClass {
////     /*props*/
////     @prop() @config() public prop: /*2*/string;
////     @config({ required: true }) public requireConfig: string[];
////     constructor(c: IExtClass) {
////         this./*1*/
////     }
//// }

goTo.marker('props');
edit.insertLine("@config() public addedProp: IExtClass");
goTo.marker('1');
verify.completionListContains("addedProp");


goTo.marker('2');
edit.deleteAtCaret("string".length);
edit.insert("ExtClass");
goTo.marker('1');
verify.completionListContains("prop");
verify.completionEntryDetailIs("prop", "(property) ExtClass.prop: ExtClass");

goTo.marker('props');
edit.insertLine("@config() public addedGenericProp: Generic<IExtClass>");
goTo.marker('1');
verify.completionListContains("addedGenericProp");
verify.completionEntryDetailIs("addedGenericProp", "(property) ExtClass.addedGenericProp: Generic<IExtClass>");

