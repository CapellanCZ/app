import type { EventArg } from '@react-navigation/native';

import { openDefaultBooking } from '@/lib/health-service/openDefaultBooking';

let opening = false;

/** Center (+) tab — open booking without staying on the book route. */
export function onBookTabPress(e: EventArg<'tabPress', true, undefined>) {
  e.preventDefault();
  if (opening) return;
  opening = true;
  void openDefaultBooking().finally(() => {
    opening = false;
  });
}
