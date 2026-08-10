'use client';

import { StatusLabel } from '@components/misc/status-label.component';
import { ErrandDTO } from '@data-contracts/backend/data-contracts';
import { getTypeDisplayName } from '@utils/errand-helpers';
import { ArrowRight } from 'lucide-react';
import { Button } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

interface MobileErrandCardProps {
  errand: ErrandDTO;
}

export const MobileErrandCard: React.FC<MobileErrandCardProps> = ({ errand }) => {
  const router = useRouter();
  const url = `/arende/${errand.errandNumber}/grundinformation`;

  return (
    <div className="py-4">
      <div className="flex min-h-[8rem] items-end self-stretch rounded-[20px] border border-opacity-30 pt-[2.0rem] pb-[1.2rem] pl-[2.0rem] pr-[0.8rem] gap-4">
        <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
          <div className="w-fit">
            <StatusLabel status={errand.status} />
          </div>

          <div className="text-xl font-bold lining-nums proportional-nums leading-[2.8rem] pt-[1.2rem] break-words">
            {getTypeDisplayName(errand)}
          </div>

          <div className="flex flex-col items-start gap-1.5 pt-[2.4rem] flex-1">
            <div className="text-base lining-nums proportional-nums leading-[2.4rem]">
              <span className="font-[700]">Registrerat</span> {dayjs(errand.created).format('YYYY-MM-DD')}
            </div>
          </div>
        </div>

        <Button
          className="flex items-center justify-center p-[1.2rem]"
          iconButton
          type="button"
          size="lg"
          leftIcon={<ArrowRight />}
          color="primary"
          variant="tertiary"
          onClick={() => router.push(url)}
        />
      </div>
    </div>
  );
};
