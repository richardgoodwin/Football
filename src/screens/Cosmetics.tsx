import { Lock, Check } from 'lucide-react';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ALL_COSMETICS } from '@/data/cosmetics';
import { isUnlocked, unlockRequirementText } from '@/game/unlocks';
import { useProfile } from '@/store/profileStore';
import type { Cosmetic, CosmeticType } from '@/types/cosmetic';
import type { ProfileState } from '@/types/profile';

type EquipSlot = keyof ProfileState['equipped'];

const TYPE_LABEL: Record<CosmeticType, string> = {
  avatar: 'Avatars',
  'stadium-theme': 'Stadium Themes',
  'badge-frame': 'Badge Frames',
  'quiz-effect': 'Quiz Effects',
  'sound-pack': 'Sound Packs',
};

const RARITY_STYLE: Record<Cosmetic['rarity'], string> = {
  common: 'border-slate-500/30',
  rare: 'border-sky-400/40 bg-sky-500/5',
  epic: 'border-fuchsia-400/40 bg-fuchsia-500/5',
  legendary: 'border-amber-400/50 bg-amber-500/5',
};

const SLOT_MAP: Record<CosmeticType, EquipSlot> = {
  avatar: 'avatar',
  'stadium-theme': 'theme',
  'badge-frame': 'badgeFrame',
  'quiz-effect': 'quizEffect',
  'sound-pack': 'soundPack',
};

export function Cosmetics() {
  const profile = useProfile();
  const equip = useProfile((s) => s.equip);
  const unlockCosmetic = useProfile((s) => s.unlockCosmetic);

  const grouped = ALL_COSMETICS.reduce<Record<CosmeticType, Cosmetic[]>>((acc, c) => {
    (acc[c.type] ||= []).push(c);
    return acc;
  }, {} as Record<CosmeticType, Cosmetic[]>);

  return (
    <Screen title="Cosmetics">
      <section className="py-6 space-y-8">
        <h2 className="font-display text-4xl tracking-wide">Cosmetics</h2>
        <p className="text-slate-300">
          Unlock cosmetics by levelling up, completing Career tiers and earning achievements.
        </p>

        {(Object.keys(grouped) as CosmeticType[]).map((type) => (
          <div key={type}>
            <h3 className="font-display text-2xl tracking-wide mb-3">{TYPE_LABEL[type]}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {grouped[type].map((c) => {
                const unlocked = isUnlocked(c, profile);
                const owned = profile.ownedCosmetics.includes(c.id);
                const equipped = profile.equipped[SLOT_MAP[type]] === c.id;
                return (
                  <Card key={c.id} className={['p-4 border', RARITY_STYLE[c.rarity]].join(' ')}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-xs uppercase tracking-wider text-slate-400">
                          {c.rarity}
                        </div>
                      </div>
                      {equipped ? (
                        <span className="text-correct inline-flex items-center gap-1 text-xs font-semibold">
                          <Check size={14} /> Equipped
                        </span>
                      ) : !unlocked ? (
                        <Lock size={14} className="text-slate-400" />
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-300 mt-2">{c.description}</p>
                    <p className="text-xs text-slate-500 mt-2">{unlockRequirementText(c)}</p>
                    <div className="mt-3">
                      {!unlocked ? (
                        <Button size="sm" variant="ghost" disabled fullWidth>
                          Locked
                        </Button>
                      ) : !owned ? (
                        <Button
                          size="sm"
                          fullWidth
                          onClick={() => {
                            unlockCosmetic(c.id);
                          }}
                        >
                          Claim
                        </Button>
                      ) : equipped ? (
                        <Button size="sm" variant="secondary" fullWidth onClick={() => equip(SLOT_MAP[type], null)}>
                          Unequip
                        </Button>
                      ) : (
                        <Button size="sm" fullWidth onClick={() => equip(SLOT_MAP[type], c.id)}>
                          Equip
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </Screen>
  );
}
