import * as migration_20261008_045023_initial from './20261008_045023_initial';

export const migrations = [
  {
    up: migration_20261008_045023_initial.up,
    down: migration_20261008_045023_initial.down,
    name: '20261008_045023_initial'
  },
];
