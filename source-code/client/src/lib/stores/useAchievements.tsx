import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
  category: 'mysteries' | 'clues' | 'collaboration' | 'special';
}

interface AchievementsState {
  achievements: Achievement[];
  
  initializeAchievements: () => void;
  unlockAchievement: (id: string) => void;
  updateProgress: (id: string, progress: number) => void;
  checkAndUnlockAchievements: (stats: {
    mysteriesSolved: number;
    cluesDiscovered: number;
    theoriesShared: number;
    collaborativeSolves: number;
  }) => void;
}

const defaultAchievements: Achievement[] = [
  {
    id: 'first_mystery',
    title: 'First Case Closed',
    description: 'Solve your first historical mystery',
    icon: '🔍',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    category: 'mysteries',
  },
  {
    id: 'detective_master',
    title: 'Master Detective',
    description: 'Solve 5 mysteries',
    icon: '🕵️',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    category: 'mysteries',
  },
  {
    id: 'clue_finder',
    title: 'Clue Finder',
    description: 'Discover 10 clues',
    icon: '📜',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
    category: 'clues',
  },
  {
    id: 'historian',
    title: 'True Historian',
    description: 'Discover 25 clues',
    icon: '📚',
    unlocked: false,
    progress: 0,
    maxProgress: 25,
    category: 'clues',
  },
  {
    id: 'team_player',
    title: 'Team Player',
    description: 'Share 5 theories with teammates',
    icon: '🤝',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    category: 'collaboration',
  },
  {
    id: 'collaborative_genius',
    title: 'Collaborative Genius',
    description: 'Solve 3 mysteries with teammates',
    icon: '🎓',
    unlocked: false,
    progress: 0,
    maxProgress: 3,
    category: 'collaboration',
  },
  {
    id: 'ancient_expert',
    title: 'Ancient Rome Expert',
    description: 'Solve all Ancient Rome mysteries',
    icon: '🏛️',
    unlocked: false,
    progress: 0,
    maxProgress: 2,
    category: 'special',
  },
  {
    id: 'medieval_scholar',
    title: 'Medieval Scholar',
    description: 'Solve all Medieval Europe mysteries',
    icon: '⚔️',
    unlocked: false,
    progress: 0,
    maxProgress: 2,
    category: 'special',
  },
  {
    id: 'victorian_detective',
    title: 'Victorian Detective',
    description: 'Solve all Victorian Era mysteries',
    icon: '🎩',
    unlocked: false,
    progress: 0,
    maxProgress: 2,
    category: 'special',
  },
  {
    id: 'speed_solver',
    title: 'Speed Solver',
    description: 'Solve a mystery in under 5 minutes',
    icon: '⚡',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    category: 'special',
  },
];

export const useAchievements = create<AchievementsState>()(
  persist(
    (set, get) => ({
      achievements: [],

      initializeAchievements: () => {
        const state = get();
        if (state.achievements.length === 0) {
          set({ achievements: defaultAchievements });
        }
      },

      unlockAchievement: (id) => {
        set((state) => ({
          achievements: state.achievements.map((achievement) =>
            achievement.id === id && !achievement.unlocked
              ? { ...achievement, unlocked: true, unlockedAt: Date.now() }
              : achievement
          ),
        }));
      },

      updateProgress: (id, progress) => {
        set((state) => ({
          achievements: state.achievements.map((achievement) => {
            if (achievement.id === id) {
              const newProgress = Math.min(progress, achievement.maxProgress);
              const shouldUnlock = newProgress >= achievement.maxProgress && !achievement.unlocked;
              
              return {
                ...achievement,
                progress: newProgress,
                unlocked: shouldUnlock ? true : achievement.unlocked,
                unlockedAt: shouldUnlock ? Date.now() : achievement.unlockedAt,
              };
            }
            return achievement;
          }),
        }));
      },

      checkAndUnlockAchievements: (stats) => {
        const state = get();
        
        state.updateProgress('first_mystery', stats.mysteriesSolved);
        state.updateProgress('detective_master', stats.mysteriesSolved);
        state.updateProgress('clue_finder', stats.cluesDiscovered);
        state.updateProgress('historian', stats.cluesDiscovered);
        state.updateProgress('team_player', stats.theoriesShared);
        state.updateProgress('collaborative_genius', stats.collaborativeSolves);
      },
    }),
    {
      name: 'mystery-achievements',
    }
  )
);
