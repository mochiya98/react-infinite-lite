import React, { Component, ReactNode } from "react";

const enum InfiniteEnums {
  CONTAINER_HEIGHT_SCALE_FACTOR = "containerHeightScaleFactor",
}

type InfiniteProps = React.PropsWithChildren<{
  children: ReactNode[];
  className?: string;
  containerHeight: number;
  elementHeight: number | number[];
  preloadAdditionalHeight?: number | ContainerHeightScaleFactor;
  infiniteLoadBeginEdgeOffset?: number;
  isInfiniteLoading?: boolean;
  loadingSpinnerDelegate?: ReactNode;
  optionalHeader?: ReactNode;
  onInfiniteLoad?: Function;
  handleScroll?: Function;
  timeScrollStateLastsForAfterUserScrolls?: number;
}>;
type InfiniteState = {
  _elementHeights: number[];
  _prevProps: InfiniteProps | null;
  _isInfiniteLoading: boolean | undefined;
  _padStart: number;
  _padEnd: number;
  _startIdx: number;
  _endIdx: number;
  _scrollTop: number;
  _disablePointerEvents: boolean;
};
type ContainerHeightScaleFactor = {
  type: InfiniteEnums.CONTAINER_HEIGHT_SCALE_FACTOR;
  amount: number;
};

class Infinite extends Component<InfiniteProps, InfiniteState> {
  private _refContainer: React.RefObject<HTMLDivElement>;
  constructor(props: InfiniteProps) {
    super(props);
    this._onScroll = this._onScroll.bind(this);
    this._checkState = this._checkState.bind(this);
    this.state = {
      _prevProps: null,
      _scrollTop: 0,
    } as any; // props will be calculated in getDerivedStateFromProps
    this._refContainer = React.createRef();
  }
  private static _computeVisibleIndex(
    { children, containerHeight, preloadAdditionalHeight }: InfiniteProps,
    _scrollTop: number,
    elementHeights: number[]
  ): {
    _padStart: number;
    _padEnd: number;
    _startIdx: number;
    _endIdx: number;
    _scrollTop: number;
  } {
    const elementsCount = children.length;
    let visibleRangeStart = _scrollTop;
    let visibleRangeEnd = _scrollTop + containerHeight;
    if (preloadAdditionalHeight) {
      let additionalHeight;
      if (typeof preloadAdditionalHeight === "number") {
        additionalHeight = preloadAdditionalHeight;
      } else {
        additionalHeight = containerHeight * preloadAdditionalHeight.amount;
      }
      visibleRangeStart -= additionalHeight;
      visibleRangeEnd += additionalHeight;
    }
    let currentElementScrollPos = 0;
    let i = 0;
    let _startIdx = children.length - 1;
    let _endIdx = children.length;
    let _padStart = 0;
    let _padEnd = 0;
    for (; i < elementsCount; i++) {
      if (currentElementScrollPos > visibleRangeStart) {
        _startIdx = i - 1;
        break;
      }
      if (i % 5 === 0) {
        _padStart = currentElementScrollPos;
      }
      currentElementScrollPos += elementHeights[i];
    }
    for (; i < elementsCount; i++) {
      currentElementScrollPos += elementHeights[i];
      if (currentElementScrollPos > visibleRangeEnd) {
        _endIdx = i + 1;
        break;
      }
    }
    _startIdx = _startIdx - (_startIdx % 5);
    _endIdx = _endIdx + ((5 - (_endIdx % 5)) % 5);
    for (i = _endIdx; i < elementsCount; i++) {
      _padEnd += elementHeights[i];
    }
    return { _padStart, _padEnd, _startIdx, _endIdx, _scrollTop };
  }
  static getDerivedStateFromProps(
    nextProps: InfiniteProps,
    prevState: InfiniteState
  ): null | InfiniteState {
    if (nextProps !== prevState._prevProps) {
      let _elementHeights: number[] = [];
      if (typeof nextProps.elementHeight === "number") {
        for (let i = nextProps.children.length; i--; ) {
          _elementHeights.push(nextProps.containerHeight);
        }
      } else {
        _elementHeights = nextProps.elementHeight;
      }
      return {
        ...prevState,
        ...Infinite._computeVisibleIndex(
          nextProps,
          prevState._scrollTop,
          _elementHeights
        ),
        _elementHeights,
        _isInfiniteLoading: nextProps.isInfiniteLoading,
        _prevProps: nextProps,
      };
    }
    return null;
  }
  private _checkState(): Partial<InfiniteState> | undefined {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const container = this._refContainer.current!;
    const { handleScroll } = this.props;
    const { _elementHeights } = this.state;
    let computedState = Infinite._computeVisibleIndex(
      this.props,
      container.scrollTop,
      _elementHeights
    );
    let partialState: Partial<InfiniteState> | undefined;
    if (handleScroll) handleScroll(container);
    if (
      computedState._startIdx !== this.state._startIdx ||
      computedState._endIdx !== this.state._endIdx
    ) {
      partialState = computedState;
    }
    let infiniteState = this._checkInfinite();
    if (infiniteState)
      partialState = Object.assign(infiniteState, partialState);
    return partialState;
  }
  private _onScroll(): void {
    let newState = this._checkState();
    if (newState) this.setState(newState as InfiniteState);
  }
  private _checkInfinite(): Partial<InfiniteState> | undefined {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const container = this._refContainer.current!;
    const { infiniteLoadBeginEdgeOffset } = this.props;
    const { _isInfiniteLoading } = this.state;
    if (infiniteLoadBeginEdgeOffset !== undefined && !_isInfiniteLoading) {
      const {
        containerHeight,
        infiniteLoadBeginEdgeOffset,
        onInfiniteLoad,
      } = this.props;
      let elementsFullHeight = 0;
      for (
        let i = 0, elementsCount = this.props.children.length;
        i < elementsCount;
        i++
      ) {
        elementsFullHeight += this.state._elementHeights[i];
      }
      let remainingHeight =
        elementsFullHeight - container.scrollTop - containerHeight;
      if ((infiniteLoadBeginEdgeOffset as number) > remainingHeight) {
        if (onInfiniteLoad) onInfiniteLoad();
        return { _isInfiniteLoading: true };
      }
    }
  }
  componentDidMount(): void {
    let newState = this._checkState();
    if (newState) this.setState(newState as InfiniteState);
  }
  componentDidUpdate(): void {
    let newState = this._checkState();
    if (newState) this.setState(newState as InfiniteState);
  }
  static containerHeightScaleFactor(
    factor: number
  ): ContainerHeightScaleFactor {
    return {
      type: InfiniteEnums.CONTAINER_HEIGHT_SCALE_FACTOR,
      amount: factor,
    };
  }
  render(): ReactNode {
    const {
      _padStart,
      _padEnd,
      _startIdx,
      _endIdx,
      _isInfiniteLoading,
    } = this.state;
    const {
      className = "",
      containerHeight,
      loadingSpinnerDelegate,
      optionalHeader = null,
      children,
    } = this.props;
    /* console.log(
			padStart,
			JSON.stringify(this.props.children.slice(0, startIdx).map(c=>c.props.style.height.slice(0,-2)-0)),
			JSON.stringify(this.props.children.slice(startIdx, endIdx).map(c=>c.props.style.height.slice(0,-2)-0)),
			JSON.stringify(this.props.children.slice(endIdx).map(c=>c.props.style.height.slice(0,-2)-0)),
			padEnd
		); */
    return (
      <div
        className={className}
        onScroll={this._onScroll}
        ref={this._refContainer}
        style={{
          height: containerHeight + "px",
          overflow: "hidden scroll",
        }}
      >
        <div
          style={{
            paddingTop: _padStart + "px",
            paddingBottom: _padEnd + "px",
          }}
        >
          {optionalHeader}
          {children.slice(_startIdx, _endIdx)}
          {_isInfiniteLoading && _endIdx >= children.length
            ? loadingSpinnerDelegate
            : null}
        </div>
      </div>
    );
  }
}

export default Infinite;
