/**
 * virtual-list.tsx
 * =================
 * 虚拟滚动列表组件 - 高性能大数据集渲染
 * 
 * 功能:
 * - 虚拟滚动 - 只渲染可见区域的项目
 * - 动态高度支持 - 支持可变高度的项目
 * - 滚动优化 - 平滑滚动体验
 * - 内存优化 - 减少DOM节点数量
 */

import React, { useState, useRef, useCallback, useMemo } from "react";
import { cn } from "./utils";

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  threshold?: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 3,
  onScroll,
  onLoadMore,
  hasMore = false,
  loading = false,
  threshold = 100,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const getItemHeight = useCallback(
    (index: number) => {
      return typeof itemHeight === "function" ? itemHeight(index) : itemHeight;
    },
    [itemHeight]
  );

  const totalHeight = useMemo(() => {
    if (typeof itemHeight === "function") {
      return items.reduce((acc, _, index) => acc + getItemHeight(index), 0);
    }
    return items.length * itemHeight;
  }, [items, itemHeight, getItemHeight]);

  const { startIndex, endIndex, offsetY } = useMemo(() => {
    if (typeof itemHeight === "function") {
      let currentOffset = 0;
      let start = 0;
      let end = items.length;

      for (let i = 0; i < items.length; i++) {
        const height = getItemHeight(i);
        if (currentOffset + height > scrollTop - overscan * getItemHeight(i)) {
          start = Math.max(0, i - overscan);
          break;
        }
        currentOffset += height;
      }

      currentOffset = 0;
      for (let i = 0; i < items.length; i++) {
        const height = getItemHeight(i);
        if (currentOffset > scrollTop + containerHeight + overscan * height) {
          end = Math.min(items.length, i + overscan);
          break;
        }
        currentOffset += height;
      }

      let offset = 0;
      for (let i = 0; i < start; i++) {
        offset += getItemHeight(i);
      }

      return { startIndex: start, endIndex: end, offsetY: offset };
    }

    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return {
      startIndex: start,
      endIndex: end,
      offsetY: start * itemHeight,
    };
  }, [scrollTop, items.length, itemHeight, containerHeight, overscan, getItemHeight]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);

      if (onLoadMore && hasMore && !loading) {
        const scrollBottom = newScrollTop + containerHeight;
        if (totalHeight - scrollBottom < threshold) {
          onLoadMore();
        }
      }
    },
    [onScroll, onLoadMore, hasMore, loading, containerHeight, totalHeight, threshold]
  );

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, index) => {
      const actualIndex = startIndex + index;
      return (
        <div
          key={actualIndex}
          style={{
            height: getItemHeight(actualIndex),
            position: "absolute",
            top: offsetY + index * (typeof itemHeight === "number" ? itemHeight : 0),
            left: 0,
            right: 0,
          }}
        >
          {renderItem(item, actualIndex)}
        </div>
      );
    });
  }, [items, startIndex, endIndex, renderItem, getItemHeight, offsetY, itemHeight]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {visibleItems}
      </div>
      {loading && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
}

export interface VirtualGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  gap?: number;
  overscan?: number;
}

export function VirtualGrid<T>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  renderItem,
  className,
  gap = 0,
  overscan = 2,
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const columnsCount = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const rowsCount = Math.ceil(items.length / columnsCount);
  const totalHeight = rowsCount * (itemHeight + gap) - gap;

  const { startRow, endRow, startCol, endCol } = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
    const endRow = Math.min(
      rowsCount,
      Math.ceil((scrollTop + containerHeight) / (itemHeight + gap)) + overscan
    );
    const startCol = Math.max(0, Math.floor(scrollLeft / (itemWidth + gap)) - overscan);
    const endCol = Math.min(
      columnsCount,
      Math.ceil((scrollLeft + containerWidth) / (itemWidth + gap)) + overscan
    );

    return { startRow, endRow, startCol, endCol };
  }, [scrollTop, scrollLeft, itemHeight, itemWidth, containerHeight, containerWidth, gap, overscan, rowsCount, columnsCount]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);
  }, []);

  const visibleItems = useMemo(() => {
    const items_to_render: React.ReactNode[] = [];

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const index = row * columnsCount + col;
        if (index < items.length) {
          items_to_render.push(
            <div
              key={index}
              style={{
                position: "absolute",
                top: row * (itemHeight + gap),
                left: col * (itemWidth + gap),
                width: itemWidth,
                height: itemHeight,
              }}
            >
              {renderItem(items[index], index)}
            </div>
          );
        }
      }
    }

    return items_to_render;
  }, [items, startRow, endRow, startCol, endCol, columnsCount, itemHeight, itemWidth, gap, renderItem]);

  return (
    <div
      className={cn("relative overflow-auto", className)}
      style={{ width: containerWidth, height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ width: columnsCount * (itemWidth + gap) - gap, height: totalHeight, position: "relative" }}>
        {visibleItems}
      </div>
    </div>
  );
}
