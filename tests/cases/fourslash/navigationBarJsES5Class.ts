/// <reference path="fourslash.ts"/>

// @Filename: foo.js
////function Foo() {
////}
////Foo.prototype.bar = function (x) {
////  
////};
////
////Foo.bar2 = function (x) {
////  
////};


verify.navigationTree({
  "text": "<global>",
  "kind": "script",
  "childItems": [
    {
      "text": "bar2",
      "kind": "function"
    },
    {
      "text": "Foo",
      "kind": "function",
      "childItems": [
        {
          "text": "bar",
          "kind": "function",
          "childItems": [
            {
              "text": "s",
              "kind": "function"
            }
          ]
        },
        {
          "text": "bar2",
          "kind": "function",
          "childItems": [
            {
              "text": "s",
              "kind": "function"
            }
          ]
        },
        {
          "text": "s",
          "kind": "function"
        }
      ]
    }
  ]
});

verify.navigationBar([
  {
    "text": "<global>",
    "kind": "script",
    "childItems": [
      {
        "text": "bar2",
        "kind": "function"
      },
      {
        "text": "Foo",
        "kind": "function"
      }
    ]
  },
  {
    "text": "bar2",
    "kind": "function",
    "indent": 1
  },
  {
    "text": "Foo",
    "kind": "function",
    "childItems": [
      {
        "text": "bar",
        "kind": "function"
      },
      {
        "text": "bar2",
        "kind": "function"
      },
      {
        "text": "s",
        "kind": "function"
      }
    ],
    "indent": 1
  },
  {
    "text": "bar",
    "kind": "function",
    "childItems": [
      {
        "text": "s",
        "kind": "function"
      }
    ],
    "indent": 2
  },
  {
    "text": "bar2",
    "kind": "function",
    "childItems": [
      {
        "text": "s",
        "kind": "function"
      }
    ],
    "indent": 2
  }
]);
