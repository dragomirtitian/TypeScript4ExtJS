/// <reference path='fourslash.ts' />

// @allowJs: true
// @checkJs: true
// @noEmit: true
// @noImplicitAny: true
// @Filename: declarations.d.ts
////interface I { i(): void; }
////interface J { j(): void; }
// @Filename: important.js
/////** @implements {I} */
////class C {}
/////** 
//// * @implements {I} 
//// * @implements {J} 
//// */
////class D  {}

goTo.file("important.js");
verify.codeFixAll({
    fixId: "fixClassIncorrectlyImplementsInterface",
    fixAllDescription: "Implement all unimplemented interfaces",
    newFileContent:
`/** @implements {I} */
class C {
    i() {
        throw new Error("Method not implemented.");
    }
    j() {
        throw new Error("Method not implemented.");
    }
}
/** 
 * @implements {I} 
 * @implements {J} 
 */
class D {
    j() {
        throw new Error("Method not implemented.");
    }
}`,
});
