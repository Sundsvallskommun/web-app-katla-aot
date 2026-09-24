import { redirect } from 'next/navigation';
import { REGISTER_ERRAND_PATH } from 'src/constants/routes';

export default function RootIndex() {
  redirect(REGISTER_ERRAND_PATH);
}
