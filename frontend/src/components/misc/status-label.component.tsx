import { Label, LabelProps } from '@sk-web-gui/react';
import { Check, CirclePause, Clock10, Pen, SquarePen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const StatusLabel: React.FC<{ status?: string }> = ({ status }) => {
  const { t } = useTranslation();
  let color: LabelProps['color'],
    inverted = false,
    icon: React.ReactNode = null;
  switch (status) {
    case 'SOLVED':
      color = 'primary';
      icon = <Check size={16} />;
      break;
    case 'ONGOING':
      color = 'gronsta';
      icon = <Pen size={16} />;
      break;
    case 'NEW':
      color = 'vattjom';
      break;
    case 'DRAFT':
      color = 'tertiary';
      icon = <SquarePen size={16} />;
      break;
    case 'PENDING':
      color = 'gronsta';
      inverted = true;
      icon = <Clock10 size={16} />;
      break;
    case 'AWAITING_INTERNAL_RESPONSE':
      color = 'gronsta';
      inverted = true;
      icon = <Clock10 size={16} />;
      break;
    case 'SUSPENDED':
      color = 'warning';
      inverted = true;
      icon = <CirclePause size={16} />;
      break;
    case 'ASSIGNED':
      color = 'warning';
      inverted = false;
      icon = <CirclePause size={16} />;
      break;
    case 'UPSTART':
      color = 'tertiary';
      inverted = true;
      break;
    case 'PUBLISH_SELECTION':
      color = 'vattjom';
      inverted = true;
      break;
    case 'INTERNAL_CONTROL_AND_INTERVIEWS':
      color = 'tertiary';
      inverted = true;
      break;
    case 'REFERENCE_CHECK':
      color = 'juniskar';
      inverted = true;
      break;
    case 'REVIEW':
      color = 'warning';
      inverted = true;
      break;
    case 'SECURITY_CLEARENCE':
      color = 'bjornstigen';
      inverted = true;
      break;
    case 'FEEDBACK_CLOSURE':
      color = 'error';
      inverted = true;
      break;
    default:
      color = 'tertiary';
      break;
  }

  return (
    <Label rounded inverted={inverted} color={color} className={`max-h-full h-auto text-center whitespace-nowrap`}>
      {/* Statuskoden är språkneutral. Statusar utan egen text (t.ex. UPSTART) visar bara
          färg och ikon, precis som tidigare. */}
      {icon} {t(`common:status.${status ?? ''}`, { defaultValue: '' })}
    </Label>
  );
};
