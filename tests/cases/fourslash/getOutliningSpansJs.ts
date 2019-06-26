/// <reference path="fourslash.ts"/>

// @checkJs: true
// @allowJs: true
// @Filename: bug24730.js
//// [|/**
//// * @param {string} x Bla
//// */|]
//// [|Foo.prototype.bar = function (x) {
//// };|]
//// [|/**
////  * @param {string} x Bla
////  */|]
//// [|function Foo() {
//// }|]

verify.outliningSpansInCurrentFile(test.ranges());

