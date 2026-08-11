import { Redirect } from 'expo-router';

import { ROUTES } from '@/lib/routes';

/** Legacy stack route — School Doctors now lives on the Book (+) tab. */
export default function DoctorsRedirect() {
  return <Redirect href={ROUTES.healthServiceDoctors} />;
}
