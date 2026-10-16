import { getCoreApi } from '../core/core-api.mjs';

export function openEncounterDocumentation() {
  const documentation = getCoreApi()?.ui?.documentation;
  if (!documentation) throw Error('Morelord Core documentation is unavailable.');
  documentation.register({
    id: 'morelord-encounters', title: game.i18n.localize('MORELORD_ENCOUNTERS.Name'), icon: 'fa-solid fa-hydra',
    source: { home: 'modules/morelord-encounters/docs/README.md', gm: 'modules/morelord-encounters/docs/gm-manual.md', player: 'modules/morelord-encounters/docs/player-guide.md' }
  });
  return documentation.open('morelord-encounters');
}
