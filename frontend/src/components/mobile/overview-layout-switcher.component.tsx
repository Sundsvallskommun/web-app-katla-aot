'use client';

import { OverviewSidebar } from '@components/sidebars/overview-sidebar.component';
import { MOBILE_BREAKPOINT } from 'src/constants/responsive';
import { useMediaQuery } from 'src/hooks/use-media-query';

interface OverviewLayoutSwitcherProps {
  children: React.ReactNode;
}

export const OverviewLayoutSwitcher: React.FC<OverviewLayoutSwitcherProps> = ({ children }) => {
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);

  if (isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="flex">
      <OverviewSidebar />
      <div className="flex-grow">{children}</div>
    </div>
  );
};
