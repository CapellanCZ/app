import { useCallback, useEffect, useState } from 'react';
import { createElement } from 'react';

import { deleteSdaoRow, listSdaoRows, type SdaoRow } from '@/lib/scholarships/sdaoAdminApi';
import type { SdaoTableConfig } from '@/lib/scholarships/sdaoAdminConfig';

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  const s = String(value);
  return s.length > 80 ? `${s.slice(0, 77)}…` : s;
}

type SdaoWebDataTableProps = {
  config: SdaoTableConfig;
};

export function SdaoWebDataTable({ config }: SdaoWebDataTableProps) {
  const [rows, setRows] = useState<SdaoRow[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const columns = ['id', ...config.previewColumns.filter((c) => c !== 'id')];

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await listSdaoRows(config.key, { limit: 200 });
      setRows(result.rows);
      setCount(result.count);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
      setRows([]);
      setCount(0);
    }
  }, [config.key]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const handleRefresh = () => {
    setLoading(true);
    load().finally(() => setLoading(false));
  };

  const handleDelete = async (id: string) => {
    if (config.readOnly) return;
    if (!window.confirm('Delete this record? This cannot be undone.')) return;
    try {
      await deleteSdaoRow(config.key, id);
      if (selectedId === id) setSelectedId(null);
      await load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const selectedRow = rows.find((r) => String(r.id) === selectedId);

  return createElement(
    'div',
    { className: 'sdao-web-page' },
    createElement('header', { className: 'sdao-web-page__header' }, [
      createElement('div', { key: 'titles' }, [
        createElement('h2', { className: 'sdao-web-page__title', key: 'title' }, config.title),
        createElement('p', { className: 'sdao-web-page__desc', key: 'desc' }, config.description),
        createElement(
          'p',
          { className: 'sdao-web-page__meta', key: 'meta' },
          `${config.tableName} · ${count} row${count === 1 ? '' : 's'}${config.readOnly ? ' · Read only' : ''}`,
        ),
      ]),
      createElement(
        'div',
        { className: 'sdao-web-page__actions', key: 'actions' },
        createElement(
          'button',
          { type: 'button', className: 'sdao-web-btn sdao-web-btn--secondary', onClick: handleRefresh },
          loading ? 'Loading…' : 'Refresh',
        ),
      ),
    ]),
    error
      ? createElement(
          'div',
          { className: 'sdao-web-alert sdao-web-alert--error', key: 'error' },
          createElement('p', {}, error),
          createElement(
            'p',
            { className: 'sdao-web-alert__hint' },
            'Sign in as SDAO staff (profiles.office = development, user_role = staff) with an approved account.',
          ),
        )
      : null,
    loading && rows.length === 0
      ? createElement('p', { className: 'sdao-web-muted', key: 'loading' }, 'Loading…')
      : null,
    !loading && rows.length === 0 && !error
      ? createElement('p', { className: 'sdao-web-muted', key: 'empty' }, 'No records yet.')
      : null,
    rows.length > 0
      ? createElement(
          'div',
          { className: 'sdao-web-table-wrap', key: 'table' },
          createElement(
            'table',
            { className: 'sdao-web-table' },
            createElement(
              'thead',
              {},
              createElement(
                'tr',
                {},
                [
                  ...columns.map((col) =>
                    createElement('th', { key: col, scope: 'col' }, col.replace(/_/g, ' ')),
                  ),
                  !config.readOnly ? createElement('th', { key: 'actions', scope: 'col' }, 'Actions') : null,
                ].filter(Boolean),
              ),
            ),
            createElement(
              'tbody',
              {},
              rows.map((row) => {
                const id = String(row.id ?? '');
                const isSelected = selectedId === id;
                return createElement(
                  'tr',
                  {
                    key: id,
                    className: isSelected ? 'sdao-web-table__row--selected' : undefined,
                    onClick: () => setSelectedId(isSelected ? null : id),
                  },
                  [
                    ...columns.map((col) =>
                      createElement('td', { key: col, title: formatCell(row[col]) }, formatCell(row[col])),
                    ),
                    !config.readOnly
                      ? createElement(
                          'td',
                          { key: 'actions', className: 'sdao-web-table__actions' },
                          createElement(
                            'button',
                            {
                              type: 'button',
                              className: 'sdao-web-btn sdao-web-btn--danger sdao-web-btn--sm',
                              onClick: (e: { stopPropagation: () => void }) => {
                                e.stopPropagation();
                                void handleDelete(id);
                              },
                            },
                            'Delete',
                          ),
                        )
                      : null,
                  ].filter(Boolean),
                );
              }),
            ),
          ),
        )
      : null,
    selectedRow
      ? createElement(
          'section',
          { className: 'sdao-web-detail', key: 'detail' },
          [
            createElement('h3', { className: 'sdao-web-detail__title', key: 'h' }, 'Record detail'),
            createElement(
              'pre',
              { className: 'sdao-web-detail__json', key: 'json' },
              JSON.stringify(selectedRow, null, 2),
            ),
          ],
        )
      : null,
  );
}
