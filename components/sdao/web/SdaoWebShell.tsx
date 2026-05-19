import { createElement, type ReactNode } from 'react';

import { SdaoWebSidebar } from './SdaoWebSidebar';

type SdaoWebShellProps = {
  children: ReactNode;
};

export function SdaoWebShell({ children }: SdaoWebShellProps) {
  return createElement(
    'div',
    { className: 'sdao-web-app' },
    createElement(SdaoWebSidebar, {}),
    createElement('main', { className: 'sdao-web-main' }, children),
  );
}
