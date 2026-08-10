import { ErrandDTO, StakeholderDTO } from '@data-contracts/backend/data-contracts';
import { getEmployeeStakeholderFromApi } from '@services/employee-service/employee-service';
import { useUserStore } from '@services/user-service/user-service';
import { getReporterStakeholder, phoneNumberFormatter } from '@utils/stakeholder';
import { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';

export function useAutoInitReporter() {
  const { getValues, setValue } = useFormContext<ErrandDTO>();
  const user = useUserStore((s) => s.user);
  const fetching = useRef(false);

  useEffect(() => {
    if (fetching.current) return;
    if (getReporterStakeholder(getValues('stakeholders'))) return;
    if (!user.username) return;

    fetching.current = true;
    getEmployeeStakeholderFromApi(user.username)
      .then((res) => {
        const current = getValues('stakeholders') ?? [];
        if (getReporterStakeholder(current)) return;

        const stakeholder: StakeholderDTO = {
          ...res.data,
          phoneNumbers: [phoneNumberFormatter(res.data.phoneNumbers?.[0])],
          role: 'REPORTER',
        };
        setValue('stakeholders', [...current, stakeholder]);
      })
      .finally(() => {
        fetching.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.username]);
}
