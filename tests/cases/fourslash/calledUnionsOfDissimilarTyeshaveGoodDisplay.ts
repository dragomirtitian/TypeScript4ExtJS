/// <reference path="fourslash.ts" />

////declare const callableThing1:
////    | ((o1: {x: number}) => void)
////    | ((o1: {y: number}) => void)
////    ;
////
////callableThing1(/*1*/);
////
////declare const callableThing2:
////    | ((o1: {x: number}) => void)
////    | ((o2: {y: number}) => void)
////    ;
////
////callableThing2(/*2*/);
////
////declare const callableThing3:
////    | ((o1: {x: number}) => void)
////    | ((o2: {y: number}) => void)
////    | ((o3: {z: number}) => void)
////    | ((o4: {u: number}) => void)
////    | ((o5: {v: number}) => void)
////    ;
////
////callableThing3(/*3*/);
////
////declare const callableThing4:
////    | ((o1: {x: number}) => void)
////    | ((o2: {y: number}) => void)
////    | ((o3: {z: number}) => void)
////    | ((o4: {u: number}) => void)
////    | ((o5: {v: number}) => void)
////    | ((o6: {w: number}) => void)
////    ;
////
////callableThing4(/*4*/);
////
////declare const callableThing5: 
////    | (<U>(a1: U) => void)
////    | (() => void) 
////    ;
////
////callableThing5(/*5*/1)
////
////declare const callableThing6: ((p1:  { b: string }) => void) | 
////    ((p2:  { a: number }) => void) | 
////    ((p2:  { c: number }) => void) 
////
////callableThing6(/*6*/{})
////
////declare const callableThing7: ((p1:  { b: string }) => void) | 
////    ((p2_other:  { a: number }) => void) | 
////    ((p2:  { c: number }) => void) 
////
////callableThing7(/*7*/{})
////
////declare const callableThing8: ((really_really_really_long_name1:  { b: string }) => void) | 
////    ((really_really_really_really_long_name2:  { a: number }) => void) | 
////    ((really_really_really_really_long_name3:  { c: number }) => void) 
////
////callableThing8(/*8*/{})

verify.signatureHelp({
    marker: "1",
    text: "callableThing1(o1: { x: number; } & { y: number; }): void"
},
{
    marker: "2",
    text: "callableThing2(o1 & o2: { x: number; } & { y: number; }): void"
},
{
    marker: "3",
    text: "callableThing3(o1 & o2 & o3 & o4 & o5: { x: number; } & { y: number; } & { z: number; } & { u: number; } & { v: number; }): void"
},
{
    marker: "4",
    text: "callableThing4(o1 & o2 & o3 & o4 & o5 & o6: { x: number; } & { y: number; } & { z: number; } & { u: number; } & { v: number; } & { w: number; }): void"
},
{
    marker: "5",
    text: "callableThing5(a1: number): void"
},
{
    marker: "6",
    text: "callableThing6(p1 & p2: { b: string; } & { a: number; } & { c: number; }): void"
},
{
    marker: "7",
    text: "callableThing7(p1 & p2_other & p2: { b: string; } & { a: number; } & { c: number; }): void"
},
{
    marker: "8",
    text: "callableThing8(really_really_really_long_name1 & really_really_really_really_long_name2: { b: string; } & { a: number; } & { c: number; }): void"
});
