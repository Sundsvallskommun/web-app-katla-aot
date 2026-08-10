import { CenterDiv } from '@layouts/center-div.component';
import { Button, Dialog } from '@sk-web-gui/react';
import { CircleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CancelErrandDialogProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CancelErrandDialog: React.FC<CancelErrandDialogProps> = ({ show, onClose, onConfirm }) => {
  const { t } = useTranslation();

  return (
    <Dialog show={show}>
      <Dialog.Content className="-mt-20">
        <CenterDiv className="max-w-[32rem] mx-auto">
          <CircleAlert size={32} className="mb-[1.6rem] text-warning-surface-primary" />
          <h3 className="text-h3-md mb-8">{t('errand-information:cancel_confirm.title')}</h3>
          <span className="text-dark-secondary text-md text-center">
            {t('errand-information:cancel_confirm.description')}
          </span>
        </CenterDiv>
      </Dialog.Content>
      <Dialog.Buttons className="justify-center">
        <Button variant="secondary" onClick={onClose}>
          {t('errand-information:cancel_confirm.back')}
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          {t('errand-information:cancel_confirm.confirm')}
        </Button>
      </Dialog.Buttons>
    </Dialog>
  );
};
