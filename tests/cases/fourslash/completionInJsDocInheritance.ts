///<reference path="fourslash.ts" />

// @allowJs: true

// @Filename: interfaces.ts
////interface Interface {
////    method(): void;
////}

// @Filename: Foo.js

////class A<T> { value: T }
/////**
//// * @augments {/*1*/}
//// * @implements {/*2*/}
//// * @implements {A</*3*/>}
//// */
////class B extends A{
////    b(){}
////}

verify.completions({
    marker: ["1", "2", "3"],
    includes: [
        "A", 
        { name: "Interface", sortText: completion.SortText.GlobalsOrKeywords }
    ]
});
