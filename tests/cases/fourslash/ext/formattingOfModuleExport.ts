/// <reference path="../fourslash.ts"/>
////module MemoryAnalyzer {
////    export module Foo.Charting { }
////    /*@ExtJsClass*//*@ConfigInterface*/
////    class f       {

////        /*@config*//*@prop*/ test: number;

////        /*@config*//*@prop*/ test2: number;

////        public constructor(cfg: If) {
////            console.log(cfg.test);
////            this./*1*/        }

////        /*@config*//*@prop*/ test4: number;

////        /*@config*//*@vm-field*/ dialogWidth: number;
////        /*@config*//*@vm-field*/ dialogHeight: number;
////        /*@config*//*@vm-field*/ fitHeight: boolean;
////        
////    /*2*/
////}

goTo.marker("1");
edit.insert("getDialogWidth();");

goTo.marker("2");
edit.insert("}");
