import React, { useRef } from 'react';
import get from 'lodash/get';
import classNames from 'classnames';
import BaseTable from './BaseTable';
import useColumnController from './hooks/useColumnController';
import useRowExpand from './hooks/useRowExpand';
import useTableHeader, { renderTitle } from './hooks/useTableHeader';
import useRowSelect from './hooks/useRowSelect';
import { TdPrimaryTableProps, PrimaryTableCol, TableRowData } from './type';
import useSorter from './hooks/useSorter';
import useFilter from './hooks/useFilter';
import useDragSort from './hooks/useDragSort';
import useAsyncLoading from './hooks/useAsyncLoading';
import { PageInfo } from '../pagination';
import useClassName from './hooks/useClassName';
import { BaseTableProps, PrimaryTableProps } from './interface';

import { StyledProps } from '../common';

export { BASE_TABLE_ALL_EVENTS } from './BaseTable';

export interface TPrimaryTableProps extends PrimaryTableProps, StyledProps {}
export default function PrimaryTable(props: TPrimaryTableProps) {
  const { columns, columnController, style, className } = props;
  const primaryTableRef = useRef(null);
  const { tableDraggableClasses, tableBaseClass } = useClassName();
  // 自定义列配置功能
  const { tDisplayColumns, renderColumnController } = useColumnController(props);
  // 展开/收起行功能
  const { showExpandedRow, showExpandIconColumn, getExpandColumn, renderExpandedRow, onInnerExpandRowClick } =
    useRowExpand(props);
  // 排序功能
  const { renderSortIcon } = useSorter(props);
  // 行选中功能
  const { formatToRowSelectColumn, selectedRowClassNames } = useRowSelect(props);
  // 过滤功能
  const { hasEmptyCondition, isTableOverflowHidden, renderFilterIcon, renderFirstFilterRow } = useFilter(
    props,
    primaryTableRef,
  );
  // 拖拽排序功能
  const { isRowHandlerDraggable, isRowDraggable, isColDraggable } = useDragSort(props, primaryTableRef);

  const { renderTitleWidthIcon } = useTableHeader({ columns: props.columns });
  const { renderAsyncLoading } = useAsyncLoading(props);
  const primaryTableClasses = {
    [tableDraggableClasses.colDraggable]: isColDraggable,
    [tableDraggableClasses.rowHandlerDraggable]: isRowHandlerDraggable,
    [tableDraggableClasses.rowDraggable]: isRowDraggable,
    [tableBaseClass.overflowVisible]: isTableOverflowHidden === false,
  };

  // 如果想给 TR 添加类名，请在这里补充，不要透传更多额外 Props 到 BaseTable
  const tRowClassNames = (() => {
    const tClassNames = [props.rowClassName, selectedRowClassNames];
    return tClassNames.filter((v) => v);
  })();

  // 如果想给 TR 添加属性，请在这里补充，不要透传更多额外 Props 到 BaseTable
  const tRowAttributes = (() => {
    const tAttributes = [props.rowAttributes];
    if (isRowHandlerDraggable || isRowDraggable) {
      tAttributes.push(({ row }) => ({ 'data-id': get(row, props.rowKey || 'id') }));
    }
    return tAttributes.filter((v) => v);
  })();

  // 1. 影响列数量的因素有：自定义列配置、展开/收起行、多级表头；2. 影响表头内容的因素有：排序图标、筛选图标
  const getColumns = (columns: PrimaryTableCol<TableRowData>[]) => {
    const arr: PrimaryTableCol<TableRowData>[] = [];
    for (let i = 0, len = columns.length; i < len; i++) {
      let item = { ...columns[i] };
      // 自定义列显示控制
      const isDisplayColumn = item.children?.length || tDisplayColumns?.includes(item.colKey);
      if (!isDisplayColumn && props.columnController) continue;
      item = formatToRowSelectColumn(item);
      // 添加排序图标和过滤图标
      if (item.sorter || item.filter) {
        const titleContent = renderTitle(item, i);
        item.title = (p) => {
          const sortIcon = item.sorter ? renderSortIcon(p) : null;
          const filterIcon = item.filter ? renderFilterIcon(p) : null;
          return renderTitleWidthIcon([titleContent, sortIcon, filterIcon]);
        };
      }
      if (item.children?.length) {
        item.children = getColumns(item.children);
      }
      // 多级表头和自定义列配置特殊逻辑：要么子节点不存在，要么子节点长度大于 1，方便做自定义列配置
      if (!item.children || item.children?.length) {
        arr.push(item);
      }
    }
    return arr;
  };

  const tColumns = (() => {
    const cols = getColumns(columns);
    if (showExpandIconColumn) {
      cols.unshift(getExpandColumn());
    }
    return cols;
  })();

  const onInnerPageChange = (pageInfo: PageInfo, newData: Array<TableRowData>) => {
    props.onPageChange?.(pageInfo, newData);
    const changeParams: Parameters<TdPrimaryTableProps['onChange']> = [
      { pagination: pageInfo },
      { trigger: 'pagination', currentData: newData },
    ];
    props.onChange?.(...changeParams);
  };

  function formatNode(api: string, renderInnerNode: Function, condition: boolean, extra?: { reverse?: boolean }) {
    if (!condition) return props[api];
    const innerNode = renderInnerNode();
    const propsNode = props[api];
    if (innerNode && !propsNode) return innerNode;
    if (propsNode && !innerNode) return propsNode;
    if (innerNode && propsNode) {
      return extra?.reverse ? (
        <div>
          {innerNode}
          {propsNode}
        </div>
      ) : (
        <div>
          {propsNode}
          {innerNode}
        </div>
      );
    }
    return null;
  }

  const isColumnController = !!(columnController && Object.keys(columnController).length);
  const placement = isColumnController ? columnController.placement || 'top-right' : '';
  const isBottomController = isColumnController && placement?.indexOf('bottom') !== -1;
  const topContent = formatNode('topContent', renderColumnController, isColumnController && !isBottomController);
  const bottomContent = formatNode('bottomContent', renderColumnController, isBottomController, {
    reverse: true,
  });
  const firstFullRow = formatNode('firstFullRow', renderFirstFilterRow, !hasEmptyCondition);
  const lastFullRow = formatNode('lastFullRow', renderAsyncLoading, !!props.asyncLoading);

  const baseTableProps = {
    ...props,
    rowClassName: tRowClassNames,
    rowAttributes: tRowAttributes,
    columns: tColumns,
    topContent,
    bottomContent,
    firstFullRow,
    lastFullRow,
    onPageChange: onInnerPageChange,
    renderExpandedRow: showExpandedRow ? renderExpandedRow : undefined,
  } as BaseTableProps;

  if (props.expandOnRowClick) {
    baseTableProps.onRowClick = onInnerExpandRowClick;
  }

  return (
    <BaseTable
      ref={primaryTableRef}
      {...baseTableProps}
      className={classNames(primaryTableClasses, className)}
      style={style}
    />
  );
}

PrimaryTable.displayName = 'PrimaryTable';
