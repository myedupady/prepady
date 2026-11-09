import * as migration_20261008_045023_initial from './20261008_045023_initial';
import * as migration_20261020_122323_add_passages_referrals from './20261020_122323_add_passages_referrals';
import * as migration_20261023_140128_add_variant_and_posts from './20261023_140128_add_variant_and_posts';
import * as migration_20261023_210518_add_video_partners_payments from './20261023_210518_add_video_partners_payments';
import * as migration_20261109_085805_add_whatsapp_sessions from './20261109_085805_add_whatsapp_sessions';
import * as migration_20261109_141745_add_question_extra_exams from './20261109_141745_add_question_extra_exams';
import * as migration_20261109_144921_add_premium_plus from './20261109_144921_add_premium_plus';

export const migrations = [
  {
    up: migration_20261008_045023_initial.up,
    down: migration_20261008_045023_initial.down,
    name: '20261008_045023_initial',
  },
  {
    up: migration_20261020_122323_add_passages_referrals.up,
    down: migration_20261020_122323_add_passages_referrals.down,
    name: '20261020_122323_add_passages_referrals',
  },
  {
    up: migration_20261023_140128_add_variant_and_posts.up,
    down: migration_20261023_140128_add_variant_and_posts.down,
    name: '20261023_140128_add_variant_and_posts',
  },
  {
    up: migration_20261023_210518_add_video_partners_payments.up,
    down: migration_20261023_210518_add_video_partners_payments.down,
    name: '20261023_210518_add_video_partners_payments',
  },
  {
    up: migration_20261109_085805_add_whatsapp_sessions.up,
    down: migration_20261109_085805_add_whatsapp_sessions.down,
    name: '20261109_085805_add_whatsapp_sessions',
  },
  {
    up: migration_20261109_141745_add_question_extra_exams.up,
    down: migration_20261109_141745_add_question_extra_exams.down,
    name: '20261109_141745_add_question_extra_exams',
  },
  {
    up: migration_20261109_144921_add_premium_plus.up,
    down: migration_20261109_144921_add_premium_plus.down,
    name: '20261109_144921_add_premium_plus'
  },
];
