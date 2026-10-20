import * as migration_20261008_045023_initial from './20261008_045023_initial';
import * as migration_20261020_122323_add_passages_referrals from './20261020_122323_add_passages_referrals';

export const migrations = [
  {
    up: migration_20261008_045023_initial.up,
    down: migration_20261008_045023_initial.down,
    name: '20261008_045023_initial'
  },
  {
    up: migration_20261020_122323_add_passages_referrals.up,
    down: migration_20261020_122323_add_passages_referrals.down,
    name: '20261020_122323_add_passages_referrals'
  },
];
