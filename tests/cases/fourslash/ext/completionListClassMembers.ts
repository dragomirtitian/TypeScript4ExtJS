/// <reference path="../fourslash.ts" />

////module A {
////    /*@ExtJsClass*/
////    /*@ConfigInterface*/
////    class Class {
////        private privateProperty = 1;
////        /*@config*/
////        public config = 1;
////        /*@config*/ /*@prop*/
////        public prop: number = 1;
////    }
////    var c = new Class();
////    c./*1*/;

////    var ci: /*2*/ = {
////        /*3*/
////    };
////}

goTo.marker("1");
verify.memberListContains("config");
verify.not.memberListContains("getConfig");
verify.not.memberListContains("setConfig");

verify.memberListContains("prop");
verify.memberListContains("getProp");
verify.memberListContains("setProp");

edit.insert("setProp(");

verify.currentParameterHelpArgumentNameIs("value");

edit.insertLine("1)");

goTo.marker("2");
verify.memberListContains("IClass");
edit.insert("IClass");

goTo.marker("3");
verify.memberListContains("prop");
verify.memberListContains("config");

verify.numberOfErrorsInCurrentFile(0);