(function (factory) {
  var v;
  if (typeof module === "object" && typeof module.exports === "object") {
    v = factory(exports);
    if (v !== undefined) module.exports = v;
  } else {
    v = factory((window.TestCases = {}));
    if (v !== undefined) window.TestCases = v;
  }
})(function (exports) {
  const cases = [
    {
      envName: "same, pah=null(2x)",
      envKey: "same",
      envType: "same",
      options: {},
      atTop: [0, 9],
      at500: [20, 34],
      at3000: [145, 159],
    },
    {
      envName: "same, pah=0",
      envKey: "same-pah0",
      envType: "same",
      options: {
        preloadAdditionalHeight: 0,
      },
      atTop: [0, 4],
      at500: [25, 29],
      at3000: [150, 154],
    },
    {
      envName: "same, pah={amount:2(3x)}",
      envKey: "same-pah3x",
      envType: "same",
      options: {
        preloadAdditionalHeight: { amount: 2 },
      },
      atTop: [0, 14],
      at500: [15, 39],
      at3000: [140, 164],
    },
    {
      envName: "inc",
      envKey: "inc",
      envType: "inc",
      options: {},
      atTop: [0, 19],
      at500: [25, 39],
      at3000: [145, 159],
    },
  ];
  exports.cases = cases;
});
