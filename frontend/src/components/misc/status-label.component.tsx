import { Label, LabelProps } from '@sk-web-gui/react';
import { Check, CirclePause, Clock10, Pen, SquarePen } from 'lucide-react';

//TODO: Ajust enum values
enum StatusLabelEnum {
  NEW = 'Inskickat',
  DRAFT = 'Utkast',
  ONGOING = 'Pågående',
  PENDING = 'Komplettering',
  SUSPENDED = 'Parkerat',
  ASSIGNED = 'Tilldelat',
  SOLVED = 'Löst',
  AWAITING_INTERNAL_RESPONSE = 'Intern återkoppling',
}

export const StatusLabel: React.FC<{ status?: string }> = ({ status }) => {
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
      {icon} {StatusLabelEnum[status as keyof typeof StatusLabelEnum]}
    </Label>
  );
};
