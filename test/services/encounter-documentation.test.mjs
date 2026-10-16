import test from 'node:test';
import assert from 'node:assert/strict';
import {openEncounterDocumentation} from '../../scripts/services/encounter-documentation.mjs';

test('all encounter documentation actions register and open Encounters through Core UI',()=>{
  let registered,opened;
  globalThis.game={modules:new Map(),i18n:{localize:()=> 'Morelord Encounters'}};
  globalThis.MorelordCore={ui:{documentation:{register:value=>{registered=value;},open:id=>{opened=id;return 'website-opened';}}}};
  assert.equal(openEncounterDocumentation(),'website-opened');
  assert.equal(opened,'morelord-encounters');
  assert.equal(registered.source.gm,'modules/morelord-encounters/docs/gm-manual.md');
  globalThis.MorelordCore={};
  assert.throws(openEncounterDocumentation,/unavailable/);
});
