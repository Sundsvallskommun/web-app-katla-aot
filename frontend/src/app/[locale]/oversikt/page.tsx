'use client';

import { ErrandFilter } from '@components/errand-filter/errand-filter.component';
import { ErrandTable } from '@components/errand-table/errand-table.component';
import { MobileOverviewLayout } from '@components/mobile/mobile-overview-layout.component';
import { CenterDiv } from '@layouts/center-div.component';
import FilteringLayout from '@layouts/filtering-layout/filtering-layout.component';
import Main from '@layouts/main/main.component';
import { MOBILE_BREAKPOINT } from 'src/constants/responsive';
import { useMediaQuery } from 'src/hooks/use-media-query';

export default function Oversikt() {
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT);

  if (isMobile) {
    return <MobileOverviewLayout />;
  }

  return (
    <>
      <FilteringLayout>
        <CenterDiv>
          <ErrandFilter />
        </CenterDiv>
      </FilteringLayout>
      <Main>
        <CenterDiv>
          <div className="w-full max-w-screen-desktop-max">
            <ErrandTable />
          </div>
        </CenterDiv>
      </Main>
    </>
  );
}
