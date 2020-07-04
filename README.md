# @mochiya98/react-infinite-lite

[![@mochiya98/react-infinite-lite](https://img.shields.io/npm/v/@mochiya98/react-infinite-lite.svg?style=flat-square)](https://www.npmjs.com/package/@mochiya98/react-infinite-lite) [![gzip size](http://img.badgesize.io/https://unpkg.com/@mochiya98/react-infinite-lite/dist/index.esm.js?compression=gzip&style=flat-square)](https://unpkg.com/@mochiya98/react-infinite-lite/dist/index.esm.js) ![license MIT](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)

> super lightweight alternative to [react-infinite](https://www.npmjs.com/package/react-infinite)

## Installation

```sh
npm i @mochiya98/react-infinite-lite
```

## Usage

same as react-infinite  
(easy migration from react-infinite)  
see more details in [seatgeek/react-infinite README](https://github.com/seatgeek/react-infinite/blob/master/README.md)

```jsx
import Infinite from "@mochiya98/react-infinite-lite";
function App() {
  return (
    <Infinite containerHeight={100} elementHeight={30}>
      <div className="hoge">1</div>
      <div className="hoge">2</div>
      {/*...*/}
    </Infinite>
  );
}
```

### CDN

```html
<script
  src="https://unpkg.com/@mochiya98/react-infinite-lite"
  crossorigin="anonymous"
></script>
<!-- window.ReactInfiniteLite -->

<script type="text/babel">
  function App() {
    return <ReactInfiniteLite>{/*...*/}</ReactInfiniteLite>;
  }
</script>
```

## Unsupported features

- `timeScrollStateLastsForAfterUserScrolls` - can be implemented yourself by using handleScroll
- `useWindowAsScrollContainer` - not implemented yet
- `displayBottomUpwards` - not implemented yet
- `preloadBatchSize` - simplified for performance(index%5)

## Additional features

- `optionalHeader: ReactNode` - add fixed header

## Changelog

### 0.2.1 - 2020-07-05

- add missing `containerHeightScaleFactor`
- update types

### 0.2.0 - 2020-05-07

- rewrite with hooks
- add tests
- fix elementHeight behavior
