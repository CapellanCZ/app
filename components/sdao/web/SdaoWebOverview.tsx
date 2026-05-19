import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { createElement } from 'react';

/* eslint-disable-next-line import/no-unresolved */
import { pingSdaoAdmin } from '@/lib/scholarships/sdaoAdminApi';
/* eslint-disable-next-line import/no-unresolved */
import { SDAO_ADMIN_TABLES, sdaoTablePath } from '@/lib/scholarships/sdaoAdminConfig';

export function SdaoWebOverview() {
  const router = useRouter();
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [checking, setChecking] = useState(true);

  const check = useCallback(async () => {
    setChecking(true);
    setStatus(await pingSdaoAdmin());
    setChecking(false);
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  const alertClass = `sdao-web-alert ${status?.ok ? 'sdao-web-alert--success' : 'sdao-web-alert--error'}`;

  return createElement('div', { className: 'sdao-web-page' }, [
    createElement('header', { className: 'sdao-web-page__header', key: 'header' }, [
      createElement('h2', { className: 'sdao-web-page__title', key: 'title' }, 'Overview'),
      createElement(
        'p',
        { className: 'sdao-web-page__desc', key: 'desc' },
        'Web admin for all eight scholarship tables. Use the left sidebar to open a table and load data from Supabase.',
      ),
    ]),
    createElement(
      'div',
      { className: alertClass, key: 'status' },
      checking
        ? createElement('p', {}, 'Checking Supabase…')
        : [
            createElement('p', { key: 'line1' }, `Supabase: ${status?.ok ? 'Connected' : 'Issue'}`),
            createElement('p', { className: 'sdao-web-alert__hint', key: 'line2' }, status?.message ?? ''),
            createElement(
              'button',
              {
                key: 'btn',
                type: 'button',
                className: 'sdao-web-btn sdao-web-btn--secondary',
                style: { marginTop: 8 },
                onClick: () => void check(),
              },
              'Recheck',
            ),
          ],
    ),
    createElement('h3', { className: 'sdao-web-section-title', key: 'h3' }, 'Tables'),
    createElement(
      'div',
      { className: 'sdao-web-card-grid', key: 'grid' },
      SDAO_ADMIN_TABLES.map((table) =>
        createElement(
          'button',
          {
            key: table.key,
            type: 'button',
            className: 'sdao-web-card',
            onClick: () => router.push(sdaoTablePath(table.key) as never),
          },
          [
            createElement('span', { className: 'sdao-web-card__title', key: 't' }, table.title),
            createElement('span', { className: 'sdao-web-card__desc', key: 'd' }, table.description),
            createElement('code', { className: 'sdao-web-card__code', key: 'c' }, table.tableName),
          ],
        ),
      ),
    ),
  ]);
}
