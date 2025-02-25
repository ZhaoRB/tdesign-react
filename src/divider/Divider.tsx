import React from 'react';
import classNames from 'classnames';
import useConfig from '../_util/useConfig';
import { StyledProps } from '../common';
import { TdDividerProps } from './type';

/**
 * Divider 组件支持的属性。
 */
export interface DividerProps extends TdDividerProps, StyledProps {
  /**
   * 文本内容
   */
  children?: React.ReactNode;
}

/**
 * 分割线组件
 */
const Divider = (props: DividerProps) => {
  const {
    layout = 'horizontal',
    dashed,
    align = 'center',
    className,
    style,
    children,
    content,
    ...otherDividerProps
  } = props;

  const { classPrefix } = useConfig();
  const childrenNode = content || children;

  const showText = layout !== 'vertical' && !!childrenNode;

  const dividerClassNames = classNames(`${classPrefix}-divider`, className, {
    [`${classPrefix}-divider--${layout}`]: layout,
    [`${classPrefix}-divider--dashed`]: !!dashed,
    [`${classPrefix}-divider--with-text`]: showText,
    [`${classPrefix}-divider--with-text-${align}`]: showText,
  });

  return (
    <div {...otherDividerProps} className={dividerClassNames} style={style}>
      {showText ? <span className={`${classPrefix}-divider__inner-text`}>{childrenNode}</span> : null}
    </div>
  );
};

Divider.displayName = 'Divider';

export default Divider;
