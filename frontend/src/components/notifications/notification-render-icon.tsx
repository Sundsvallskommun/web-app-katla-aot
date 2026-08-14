import { NotificationDTO } from '@data-contracts/backend/data-contracts';
import { Avatar, cx } from '@sk-web-gui/react';
import { Bell, BellRing, File, type LucideIcon, MessageCircle } from 'lucide-react';

interface NotificationRenderIconProps {
  notification: NotificationDTO;
}

/**
 * OBS: nycklarna här är inte gränssnittstext utan matchas mot `notification.description`
 * precis som API:t levererar den. De ska därför varken översättas eller skrivas om – görs
 * det faller alla notiser tillbaka på standardikonen utan att något syns i typkontrollen.
 *
 * Kopplingen till fritext är i sig skör, och den håller bara så länge API:t svarar på
 * svenska. Att i stället nyckla på `subtype` (språkneutral) vore mer robust, men kräver att
 * man vet hur subtyp och beskrivning faktiskt hänger ihop i API:ts data – se separat ärende.
 */
const iconConfig: Record<string, { icon?: LucideIcon; avatar?: boolean; defaultColor: string }> = {
  'Meddelande mottaget': { icon: MessageCircle, defaultColor: 'gronsta' },
  'Parkering av ärendet har upphört': { icon: BellRing, defaultColor: 'juniskar' },
  'Ärende uppdaterat': { icon: BellRing, defaultColor: 'juniskar' },
  'En bilaga har lagts till i ärendet.': { icon: File, defaultColor: 'vattjom' },
  'Notering skapad': { avatar: true, defaultColor: 'juniskar' },
  default: { icon: Bell, defaultColor: 'vattjom' },
};

const surfaceColor: Record<string, string> = {
  juniskar: 'bg-juniskar-surface-accent',
  gronsta: 'bg-gronsta-surface-accent',
  vattjom: 'bg-vattjom-surface-accent',
  bjornstigen: 'bg-bjornstigen-surface-accent',
};

const textColor: Record<string, string> = {
  juniskar: 'text-juniskar-surface-primary',
  gronsta: 'text-gronsta-surface-primary',
  vattjom: 'text-vattjom-surface-primary',
  bjornstigen: 'text-bjornstigen-surface-primary',
  primary: 'text-primary',
};

export const NotificationRenderIcon: React.FC<NotificationRenderIconProps> = ({ notification }) => {
  const config = iconConfig[notification.description ?? ''] ?? iconConfig.default;
  const color = notification.acknowledged ? 'primary' : config.defaultColor;
  const bgColor = surfaceColor[color] ?? 'bg-tertiary-surface';

  if (config.avatar) {
    const initials =
      (notification.createdByFullName?.split(' ')[1]?.charAt(0).toUpperCase() ?? '') +
      (notification.createdByFullName?.split(' ')[0]?.charAt(0).toUpperCase() ?? '');

    return (
      <div className={cx(`w-[4rem] h-[4rem] rounded-12 flex items-center justify-center bg-${color}-surface-accent`)}>
        <Avatar data-cy="avatar-aside" className="flex-none" size="md" initials={initials} color={color} />
      </div>
    );
  }

  const Icon = config.icon;
  return (
    <div className={cx(`w-[4rem] h-[4rem] rounded-12 flex items-center justify-center`, bgColor)}>
      {Icon && <Icon size="2.4rem" className={textColor[color] ?? ''} />}
    </div>
  );
};
