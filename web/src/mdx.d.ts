import type { MDXProps } from 'mdx/types';

declare module '*.mdx' {
  import type { Element } from 'react';
  const MDXContent: (props: MDXProps) => Element;
  export default MDXContent;
}
