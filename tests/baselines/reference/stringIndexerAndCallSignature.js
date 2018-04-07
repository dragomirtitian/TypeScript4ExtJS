//// [stringIndexerAndCallSignature.ts]
type I = {
    (): string;
    [name: string]: number;
}

declare let val: { (): string } & { foo: number; }
let a: I = val;


//// [stringIndexerAndCallSignature.js]
var a = val;
