import React, {
  ReactElement,
  ReactNode,
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

const enum InfiniteEnums {
  CONTAINER_HEIGHT_SCALE_FACTOR = "chsf",
}

export type InfiniteProps = React.PropsWithChildren<{
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
  handleScroll?: (container: HTMLDivElement) => void;
  timeScrollStateLastsForAfterUserScrolls?: number;
}>;
type ContainerHeightScaleFactor = {
  type: InfiniteEnums.CONTAINER_HEIGHT_SCALE_FACTOR;
  amount: number;
};

function useVisibleIndex(
  {
    containerHeight,
    preloadAdditionalHeight,
  }: Pick<InfiniteProps, "containerHeight" | "preloadAdditionalHeight">,
  scrollTop: number,
  elementHeights: number[]
): {
  _padStart: number;
  _padEnd: number;
  _startIdx: number;
  _endIdx: number;
} {
  return useMemo(() => {
    const elementsCount = elementHeights.length;
    let visibleRangeStart = scrollTop;
    let visibleRangeEnd = scrollTop + containerHeight;

    let additionalHeight;
    if (typeof preloadAdditionalHeight === "number") {
      additionalHeight = preloadAdditionalHeight;
    } else if (preloadAdditionalHeight) {
      additionalHeight = containerHeight * preloadAdditionalHeight.amount;
    } else {
      additionalHeight = containerHeight;
    }
    visibleRangeStart -= additionalHeight;
    visibleRangeEnd += additionalHeight;

    let currentElementScrollPos = 0;
    let i = 0;
    let _startIdx = elementsCount - 1;
    let _endIdx = elementsCount;
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
      if (currentElementScrollPos >= visibleRangeEnd) {
        _endIdx = i + 1;
        break;
      }
    }
    _startIdx = _startIdx - (_startIdx % 5);
    _endIdx = _endIdx + ((5 - (_endIdx % 5)) % 5);
    for (i = _endIdx; i < elementsCount; i++) {
      _padEnd += elementHeights[i];
    }
    return { _padStart, _padEnd, _startIdx, _endIdx };
  }, [containerHeight, preloadAdditionalHeight, scrollTop, elementHeights]);
}

function useInfiniteLoader(
  {
    containerHeight,
    infiniteLoadBeginEdgeOffset,
    isInfiniteLoading = false,
    onInfiniteLoad,
  }: Pick<
    InfiniteProps,
    | "containerHeight"
    | "infiniteLoadBeginEdgeOffset"
    | "isInfiniteLoading"
    | "onInfiniteLoad"
  >,
  scrollTop: number,
  _elementHeights: number[]
): boolean {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const [_isInfiniteLoading, setIsInfiniteLoading] = useState(
    isInfiniteLoading
  );
  const elementsFullHeight = useMemo(() => {
    let elementsFullHeight = 0;
    for (let i = 0; i < _elementHeights.length; i++) {
      elementsFullHeight += _elementHeights[i];
    }
    return elementsFullHeight;
  }, [_elementHeights]);
  useEffect(() => setIsInfiniteLoading(isInfiniteLoading), [isInfiniteLoading]);
  useEffect(() => {
    if (infiniteLoadBeginEdgeOffset !== undefined && !_isInfiniteLoading) {
      const remainingHeight = elementsFullHeight - scrollTop - containerHeight;
      if (infiniteLoadBeginEdgeOffset >= remainingHeight) {
        if (onInfiniteLoad) onInfiniteLoad();
        setIsInfiniteLoading(true);
      }
    }
  }, [containerHeight, infiniteLoadBeginEdgeOffset, scrollTop, onInfiniteLoad]);

  return _isInfiniteLoading;
}

function Infinite(props: InfiniteProps): ReactElement {
  const {
    children,
    className,
    containerHeight,
    handleScroll,
    loadingSpinnerDelegate,
    optionalHeader,
    elementHeight,
  } = props;
  const refContainer = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const onScroll = useCallback(() => {
    if (handleScroll) handleScroll(refContainer.current!);
    setScrollTop(refContainer.current!.scrollTop);
  }, [handleScroll]);
  const normalizedElementHeights = useMemo(() => {
    if (typeof elementHeight === "number") {
      const _elementHeights = [];
      for (let i = 0; i < children.length; i++) {
        _elementHeights.push(elementHeight);
      }
      return _elementHeights;
    }
    return elementHeight;
  }, [children, elementHeight]);
  const { _padStart, _padEnd, _startIdx, _endIdx } = useVisibleIndex(
    props,
    scrollTop,
    normalizedElementHeights
  );
  const _isInfiniteLoading = useInfiniteLoader(
    props,
    scrollTop,
    normalizedElementHeights
  );
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
      onScroll={onScroll}
      ref={refContainer}
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

Infinite.containerHeightScaleFactor = (
  factor: number
): ContainerHeightScaleFactor => {
  return {
    type: InfiniteEnums.CONTAINER_HEIGHT_SCALE_FACTOR,
    amount: factor,
  };
};

export default Infinite;
