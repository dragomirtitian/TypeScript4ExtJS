//// [elaboratedParentCompatibility.ts]
interface Person {
    residence: House;
}

interface House {
    isHouseOfPain: boolean;
}

declare let home: House;
declare let person: Person; 

home = person.residence.isHouseOfPain; 

declare function fnHouse(home: House): void;
fnHouse(person.residence.isHouseOfPain) // Suggest person.residence
fnHouse((person.residence).isHouseOfPain) // Suggest person.residence
fnHouse(person["residence"].isHouseOfPain) // No suggestion here only suggest on dotted access

enum W { A, B, C }
let wStatic: typeof W = W.A; // Suggest W

class C {
    name: string;
    method (): C {
        let c: C = this.name; // Suggest this
        return c;
    }
}

declare function getC(): C;
let cInstance:C = getC().name // No suggestion
let cInstance2:C = cInstance.name //Suggest cInstance

interface X { x: string }
interface Y { y: number }
interface Z { z?: boolean }

type XY = X & Y;
const xy: XY = {x: 'x', y: 10};

const z1: Z = xy; // error, {xy} doesn't overlap with {z}


interface ViewStyle {
    view: number
    styleMedia: string
}
type Brand<T> = number & { __brand: T }
declare function create<T extends { [s: string]: ViewStyle }>(styles: T): { [P in keyof T]: Brand<T[P]> };
const wrapped = create({ first: { view: 0, styleMedia: "???" } });
const vs: ViewStyle = wrapped.first // error, first is a branded number


//// [elaboratedParentCompatibility.js]
"use strict";
home = person.residence.isHouseOfPain;
fnHouse(person.residence.isHouseOfPain); // Suggest person.residence
fnHouse((person.residence).isHouseOfPain); // Suggest person.residence
fnHouse(person["residence"].isHouseOfPain); // No suggestion here only suggest on dotted access
var W;
(function (W) {
    W[W["A"] = 0] = "A";
    W[W["B"] = 1] = "B";
    W[W["C"] = 2] = "C";
})(W || (W = {}));
var wStatic = W.A; // Suggest W
var C = /** @class */ (function () {
    function C() {
    }
    C.prototype.method = function () {
        var c = this.name; // Suggest this
        return c;
    };
    return C;
}());
var cInstance = getC().name; // No suggestion
var cInstance2 = cInstance.name; //Suggest cInstance
var xy = { x: 'x', y: 10 };
var z1 = xy; // error, {xy} doesn't overlap with {z}
var wrapped = create({ first: { view: 0, styleMedia: "???" } });
var vs = wrapped.first; // error, first is a branded number
