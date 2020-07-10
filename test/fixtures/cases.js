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
  exports.cases = [
    {
      envName: "same, pah=null(2x)",
      envKey: "same",
      envType: "same",
      options: {},
      at0: { visibleRange: [0, 9], paddings: [0, 6360] },
      at500: { visibleRange: [20, 34], paddings: [400, 5860] },
      at3000: { visibleRange: [145, 159], paddings: [2900, 3360] },
    },
    {
      envName: "same, pah=0",
      envKey: "same-pah0",
      envType: "same",
      options: {
        preloadAdditionalHeight: 0,
      },
      at0: { visibleRange: [0, 4], paddings: [0, 6460] },
      at500: { visibleRange: [25, 29], paddings: [500, 5960] },
      at3000: { visibleRange: [150, 154], paddings: [3000, 3460] },
    },
    {
      envName: "same, pah={amount:2(3x)}",
      envKey: "same-pah3x",
      envType: "same",
      options: {
        preloadAdditionalHeight: { amount: 2 },
      },
      at0: { visibleRange: [0, 14], paddings: [0, 6260] },
      at500: { visibleRange: [15, 39], paddings: [300, 5760] },
      at3000: { visibleRange: [140, 164], paddings: [2800, 3260] },
    },
    {
      envName: "inc",
      envKey: "inc",
      envType: "inc",
      options: {},
      at0: { visibleRange: [0, 19], paddings: [0, 6350] },
      at500: { visibleRange: [25, 39], paddings: [325, 5740] },
      at3000: { visibleRange: [145, 159], paddings: [2785, 3280] },
    },
  ];
  exports.checkScrollPositions = [0, 500, 3000];
});
