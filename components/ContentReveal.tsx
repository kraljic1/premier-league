"use client";

import { ReactNode } from 'react';
import { useContentReveal, useStaggeredReveal } from '@/lib/hooks/useContentReveal';
import { cn } from '@/lib/utils';

interface ContentRevealProps {
  children: ReactNode;
  animation?: 'fade-in' | 'slide-up' | 'slide-in-left' | 'slide-in-right' | 'scale-in' | 'slide-in-bottom';
  delay?: number;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'main' | 'header' | 'footer';
}

export function ContentReveal({
  children,
  animation = 'fade-in',
  delay = 0,
  threshold = 0.1,
  rootMargin = '0px 0px -50px 0px',
  triggerOnce = true,
  className,
  as: Component = 'div',
  ...props
}: ContentRevealProps) {
  const { elementRef, isVisible } = useContentReveal({
    threshold,
    rootMargin,
    delay,
    triggerOnce,
  });

  const commonProps = {
    ref: elementRef,
    className: cn(
      'content-reveal',
      isVisible && `content-reveal--${animation}`,
      className
    ),
    suppressHydrationWarning: true,
    ...props
  };

  switch (Component) {
    case 'section':
      return <section {...commonProps}>{children}</section>;
    case 'article':
      return <article {...commonProps}>{children}</article>;
    case 'main':
      return <main {...commonProps}>{children}</main>;
    case 'header':
      return <header {...commonProps}>{children}</header>;
    case 'footer':
      return <footer {...commonProps}>{children}</footer>;
    default:
      return <div {...commonProps}>{children}</div>;
  }
}

interface StaggeredRevealProps {
  children: ReactNode[];
  animation?: 'fade-in' | 'slide-up' | 'slide-in-left' | 'slide-in-right' | 'scale-in' | 'scale-in' | 'slide-in-bottom';
  staggerDelay?: number;
  delay?: number;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'ul' | 'ol';
  itemClassName?: string;
  itemAs?: 'div' | 'li' | 'article';
}

export function StaggeredReveal({
  children,
  animation = 'slide-up',
  staggerDelay = 100,
  delay = 0,
  threshold = 0.1,
  rootMargin = '0px 0px -50px 0px',
  triggerOnce = true,
  className,
  as: ContainerComponent = 'div',
  itemClassName,
  itemAs: ItemComponent = 'div',
  ...props
}: StaggeredRevealProps) {
  const { containerRef, getItemRef, isItemVisible } = useStaggeredReveal(
    children.length,
    {
      threshold,
      rootMargin,
      delay,
      staggerDelay,
      triggerOnce,
    }
  );

  const containerProps = {
    className,
    ...props
  };

  const itemProps = (index: number) => ({
    key: index,
    ref: getItemRef(index),
    className: cn(
      'content-reveal',
      isItemVisible(index) && `content-reveal--${animation}`,
      itemClassName
    )
  });

  const renderItems = () => children.map((child, index) => {
    const props = { ...itemProps(index), suppressHydrationWarning: true };
    switch (ItemComponent) {
      case 'li':
        return <li {...props}>{child}</li>;
      case 'article':
        return <article {...props}>{child}</article>;
      default:
        return <div {...props}>{child}</div>;
    }
  });

  switch (ContainerComponent) {
    case 'section':
      return <section ref={containerRef as any} {...containerProps} suppressHydrationWarning>{renderItems()}</section>;
    case 'ul':
      return <ul ref={containerRef as any} {...containerProps} suppressHydrationWarning>{renderItems()}</ul>;
    case 'ol':
      return <ol ref={containerRef as any} {...containerProps} suppressHydrationWarning>{renderItems()}</ol>;
    default:
      return <div ref={containerRef as any} {...containerProps} suppressHydrationWarning>{renderItems()}</div>;
  }
}

interface PageSectionRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
  rootMargin?: string;
  id?: string;
}

export function PageSectionReveal({
  children,
  className,
  delay = 0,
  threshold = 0.1,
  rootMargin = '0px 0px -50px 0px',
  id,
  ...props
}: PageSectionRevealProps) {
  const { elementRef, isVisible } = useContentReveal({
    threshold,
    rootMargin,
    delay,
    triggerOnce: true,
  });

  return (
    <div
      ref={elementRef as any}
      id={id}
      className={cn(
        'page-section-reveal',
        isVisible && 'page-section-reveal--visible',
        className
      )}
      suppressHydrationWarning
      {...props}
    >
      {children}
    </div>
  );
}

interface PageHeaderRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function PageHeaderReveal({
  children,
  className,
  delay = 0,
  ...props
}: PageHeaderRevealProps) {
  const { elementRef, isVisible } = useContentReveal({
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px',
    delay,
    triggerOnce: true,
  });

  return (
    <div
      ref={elementRef as any}
      className={cn(
        'page-header-reveal',
        isVisible && 'page-header-reveal--visible',
        className
      )}
      suppressHydrationWarning
      {...props}
    >
      {children}
    </div>
  );
}

interface CardGridRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}

export function CardGridReveal({
  children,
  className,
  delay = 0,
  staggerDelay = 100,
  ...props
}: CardGridRevealProps) {
  const childrenArray = Array.isArray(children) ? children : [children];
  const { containerRef, getItemRef, isItemVisible } = useStaggeredReveal(
    childrenArray.length,
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
      delay,
      staggerDelay,
      triggerOnce: true,
    }
  );

  return (
    <div
      ref={containerRef as any}
      className={cn('card-grid-reveal', isItemVisible(0) && 'card-grid-reveal--visible', className)}
      suppressHydrationWarning
      {...props}
    >
      {childrenArray.map((child, index) => (
        <div
          key={index}
          ref={getItemRef(index) as any}
          className={cn(
            'card-reveal',
            isItemVisible(index) && 'card-reveal--visible',
            `card-reveal--delay-${Math.min(index + 1, 6)}`
          )}
          suppressHydrationWarning
        >
          {child}
        </div>
      ))}
    </div>
  );
}