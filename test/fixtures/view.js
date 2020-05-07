/* global React,ReactDOM,ReactInfiniteLite,TestCases */
function makeTestHeights() {
  let incHeights = [...new Array(40)].map((_, n) => n + 1);
  incHeights = incHeights.concat(incHeights);
  incHeights = incHeights.concat(incHeights);
  incHeights = incHeights.concat(incHeights);
  let sameHeights = [...new Array(41)].map((_) => 20);
  sameHeights = sameHeights.concat(sameHeights);
  sameHeights = sameHeights.concat(sameHeights);
  sameHeights = sameHeights.concat(sameHeights);
  return {
    // 160 3280 * 2
    incHeights,
    // 164 3280 * 2
    sameHeights,
  };
}
function makeTestInfinite(key, heights, options) {
  const childrens = heights.map((h, i) =>
    React.createElement(
      "div",
      {
        key: `ec-${key}-${i}`,
        className: "ecnode " + (i % 2 ? "even" : "odd"),
        id: `ec-${key}-${i}`,
        style: { height: h + "px" },
      },
      "" + i
    )
  );
  return React.createElement(
    ReactInfiniteLite,
    {
      key: `ec-${key}-wrapper`,
      containerHeight: 100,
      elementHeight: heights,
      ...options,
      className:
        `infinite-wrapper ec-${key}-wrapper` +
        (options.className ? " " + options.className : ""),
    },
    childrens
  );
}

const { useState } = React;
const { cases } = TestCases;
const { incHeights, sameHeights } = makeTestHeights();
const virtualizeTestNodes = cases.map(({ envKey, envType, options }) => {
  switch (envType) {
    case "same":
      return makeTestInfinite(envKey, sameHeights, {
        className: "virtualize-test-wrapper",
        elementHeight: sameHeights[0],
        ...options,
      });
    case "inc":
      return makeTestInfinite(envKey, incHeights, {
        className: "virtualize-test-wrapper",
        ...options,
      });
  }
});
function App() {
  const [isInfiniteLoadFired, setIsInfiniteLoadFired] = useState(false);
  const [isHandleScrollFired, setIsHandleScrollFired] = useState(false);
  return React.createElement("div", {}, [
    ...virtualizeTestNodes,
    makeTestInfinite(
      "infinite-load-fire-test",
      isInfiniteLoadFired ? [500, 500] : [500],
      {
        infiniteLoadBeginEdgeOffset: 100,
        onInfiniteLoad: () => {
          setIsInfiniteLoadFired(true);
        },
        handleScroll: () => {
          setIsHandleScrollFired(true);
        },
      }
    ),
    makeTestInfinite("spinner-test-idle", [100], {
      loadingSpinnerDelegate: React.createElement(
        "div",
        { className: "spinner" },
        ""
      ),
      isInfiniteLoading: false,
    }),
    makeTestInfinite("spinner-test-loading", [100], {
      loadingSpinnerDelegate: React.createElement(
        "div",
        { className: "spinner" },
        ""
      ),
      isInfiniteLoading: true,
    }),
    React.createElement(
      "div",
      { className: "infinite-load-fired" },
      isInfiniteLoadFired + ""
    ),
    React.createElement(
      "div",
      { className: "handle-scroll-fired" },
      isHandleScrollFired + ""
    ),
  ]);
}
ReactDOM.render(React.createElement(App), document.getElementById("app"));
