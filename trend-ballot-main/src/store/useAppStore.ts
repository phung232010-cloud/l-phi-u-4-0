import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MASTER_ADMIN_KEY = 'THANGCYRUS';

export interface Candidate {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  voteCount: number;
  createdAt: string;
}

export interface CandidateRating {
  userId: string;
  userName: string;
  candidateId: string;
  groupId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface VotingGroup {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  candidates: Candidate[];
  votes: Record<string, string>;
  ratings: CandidateRating[];
  createdAt: string;
  isPublic: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface VoteLog {
  action: string;
  performedBy: string;
  metadata: string;
  timestamp: string;
}

interface StoredUser {
  email: string;
  password: string;
  user: User;
}

interface AdminKey {
  id: string;
  key: string;
  createdAt: string;
}

interface AppState {
  user: User | null;
  groups: VotingGroup[];
  logs: VoteLog[];
  registeredUsers: StoredUser[];
  isAuthenticated: boolean;
  adminKeys: AdminKey[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  register: (name: string, email: string, password: string, adminKey?: string) => boolean;
  createAdminKey: (key: string) => boolean;
  revokeAdminKey: (keyId: string) => void;
  createGroup: (name: string, description: string) => string;
  deleteGroup: (groupId: string) => boolean;
  adminDeleteGroup: (groupId: string) => boolean;
  toggleGroupVisibility: (groupId: string) => void;
  addCandidate: (groupId: string, name: string, description: string, imageUrl: string) => void;
  deleteCandidate: (groupId: string, candidateId: string) => void;
  vote: (groupId: string, candidateId: string) => boolean;
  unvote: (groupId: string) => boolean;
  resetVotes: (groupId: string) => void;
  rateCandidate: (groupId: string, candidateId: string, rating: number, comment: string) => boolean;
  getGroup: (groupId: string) => VotingGroup | undefined;
}

const defaultUsers: StoredUser[] = [
  { email: 'user@vote.vn', password: 'user123', user: { id: 'u1', name: 'Người dùng', email: 'user@vote.vn', isAdmin: false, createdAt: '2024-01-10' } },
];

const initialGroups: VotingGroup[] = [
  {
    id: 'demo-group',
    name: 'Bầu cử Đoàn trường 2024',
    description: 'Cuộc bầu cử đoàn trường THPT Nghi Lộc 3',
    ownerId: 'u1',
    candidates: [
      { id: '1', name: 'Nguyễn Văn An', description: 'Ứng viên có kinh nghiệm 10 năm. Cam kết đổi mới sáng tạo.', imageUrl: '', voteCount: 245, createdAt: '2024-01-15' },
      { id: '2', name: 'Trần Thị Bình', description: 'Chuyên gia tài chính với tầm nhìn chiến lược.', imageUrl: '', voteCount: 198, createdAt: '2024-01-15' },
      { id: '3', name: 'Lê Hoàng Cường', description: 'Lãnh đạo trẻ đầy nhiệt huyết. Ưu tiên chuyển đổi số.', imageUrl: '', voteCount: 312, createdAt: '2024-01-15' },
      { id: '4', name: 'Phạm Minh Đức', description: 'Kiến trúc sư trưởng với nhiều dự án thành công.', imageUrl: '', voteCount: 167, createdAt: '2024-01-15' },
    ],
    votes: {},
    ratings: [],
    createdAt: '2024-01-15',
    isPublic: true,
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      groups: [...initialGroups],
      logs: [
        { action: 'SYSTEM_START', performedBy: 'system', metadata: 'Hệ thống khởi động', timestamp: new Date().toISOString() },
      ],
      registeredUsers: [...defaultUsers],
      isAuthenticated: false,
      adminKeys: [],

      login: (email, password) => {
        const found = get().registeredUsers.find(u => u.email === email && u.password === password);
        if (found) {
          set({ user: { ...found.user }, isAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: () => set({ user: null, isAuthenticated: false }),

      register: (name, email, password, adminKey?) => {
        const { registeredUsers, adminKeys } = get();
        if (registeredUsers.find(u => u.email === email)) return false;
        
        let isAdmin = false;
        if (adminKey) {
          isAdmin = adminKey === MASTER_ADMIN_KEY || adminKeys.some(k => k.key === adminKey);
          if (!isAdmin) return false; // invalid admin key
        }
        
        const newUser: User = { id: `u${Date.now()}`, name, email, isAdmin, createdAt: new Date().toISOString() };
        set({
          registeredUsers: [...registeredUsers, { email, password, user: newUser }],
          user: newUser,
          isAuthenticated: true,
        });
        return true;
      },

      createAdminKey: (key) => {
        const { adminKeys } = get();
        if (key === MASTER_ADMIN_KEY || adminKeys.some(k => k.key === key)) return false;
        set({
          adminKeys: [...adminKeys, { id: `ak${Date.now()}`, key, createdAt: new Date().toISOString() }],
        });
        return true;
      },

      revokeAdminKey: (keyId) => {
        set({ adminKeys: get().adminKeys.filter(k => k.id !== keyId) });
      },

      createGroup: (name, description) => {
        const { user } = get();
        if (!user) return '';
        const id = `g${Date.now()}`;
        const newGroup: VotingGroup = { id, name, description, ownerId: user.id, candidates: [], votes: {}, ratings: [], createdAt: new Date().toISOString(), isPublic: true };
        set({
          groups: [...get().groups, newGroup],
          logs: [...get().logs, { action: 'CREATE_GROUP', performedBy: user.name, metadata: `Tạo nhóm: ${name}`, timestamp: new Date().toISOString() }],
        });
        return id;
      },

      deleteGroup: (groupId) => {
        const { user, groups } = get();
        const group = groups.find(g => g.id === groupId);
        if (!user || !group || group.ownerId !== user.id) return false;
        set({ groups: groups.filter(g => g.id !== groupId) });
        return true;
      },

      adminDeleteGroup: (groupId) => {
        const { user, groups } = get();
        if (!user?.isAdmin) return false;
        const group = groups.find(g => g.id === groupId);
        if (!group) return false;
        set({
          groups: groups.filter(g => g.id !== groupId),
          logs: [...get().logs, { action: 'ADMIN_DELETE_GROUP', performedBy: user.name, metadata: `Xóa nhóm: ${group.name}`, timestamp: new Date().toISOString() }],
        });
        return true;
      },

      toggleGroupVisibility: (groupId) => {
        const { user, groups } = get();
        const group = groups.find(g => g.id === groupId);
        if (!user || !group || group.ownerId !== user.id) return;
        set({
          groups: groups.map(g => g.id === groupId ? { ...g, isPublic: !g.isPublic } : g),
        });
      },

      addCandidate: (groupId, name, description, imageUrl) => {
        const { groups, user } = get();
        const group = groups.find(g => g.id === groupId);
        if (!group || !user || group.ownerId !== user.id) return;
        const newCandidate: Candidate = { id: `c${Date.now()}`, name, description, imageUrl, voteCount: 0, createdAt: new Date().toISOString() };
        set({
          groups: groups.map(g => g.id === groupId ? { ...g, candidates: [...g.candidates, newCandidate] } : g),
        });
      },

      deleteCandidate: (groupId, candidateId) => {
        const { groups, user } = get();
        const group = groups.find(g => g.id === groupId);
        if (!group || !user || group.ownerId !== user.id) return;
        set({
          groups: groups.map(g => g.id === groupId ? { ...g, candidates: g.candidates.filter(c => c.id !== candidateId) } : g),
        });
      },

      vote: (groupId, candidateId) => {
        const { user, groups } = get();
        if (!user) return false;
        const group = groups.find(g => g.id === groupId);
        if (!group || group.votes[user.id]) return false;
        set({
          groups: groups.map(g => g.id === groupId ? {
            ...g,
            candidates: g.candidates.map(c => c.id === candidateId ? { ...c, voteCount: c.voteCount + 1 } : c),
            votes: { ...g.votes, [user.id]: candidateId },
          } : g),
          logs: [...get().logs, { action: 'VOTE', performedBy: user.name, metadata: `Bầu cho ${candidateId} trong nhóm ${groupId}`, timestamp: new Date().toISOString() }],
        });
        return true;
      },

      unvote: (groupId) => {
        const { user, groups } = get();
        if (!user) return false;
        const group = groups.find(g => g.id === groupId);
        if (!group || !group.votes[user.id]) return false;
        const candidateId = group.votes[user.id];
        const newVotes = { ...group.votes };
        delete newVotes[user.id];
        set({
          groups: groups.map(g => g.id === groupId ? {
            ...g,
            candidates: g.candidates.map(c => c.id === candidateId ? { ...c, voteCount: Math.max(0, c.voteCount - 1) } : c),
            votes: newVotes,
          } : g),
          logs: [...get().logs, { action: 'UNVOTE', performedBy: user.name, metadata: `Hủy bầu trong nhóm ${groupId}`, timestamp: new Date().toISOString() }],
        });
        return true;
      },

      resetVotes: (groupId) => {
        const { groups, user } = get();
        const group = groups.find(g => g.id === groupId);
        if (!group || !user || group.ownerId !== user.id) return;
        set({
          groups: groups.map(g => g.id === groupId ? {
            ...g,
            candidates: g.candidates.map(c => ({ ...c, voteCount: 0 })),
            votes: {},
          } : g),
          logs: [...get().logs, { action: 'RESET_VOTES', performedBy: user.name, metadata: `Reset nhóm ${groupId}`, timestamp: new Date().toISOString() }],
        });
      },

      rateCandidate: (groupId, candidateId, rating, comment) => {
        const { user, groups } = get();
        if (!user) return false;
        const group = groups.find(g => g.id === groupId);
        if (!group) return false;
        // One rating per user per candidate
        const existingIdx = (group.ratings || []).findIndex(r => r.userId === user.id && r.candidateId === candidateId);
        const newRating: CandidateRating = {
          userId: user.id, userName: user.name, candidateId, groupId, rating, comment, createdAt: new Date().toISOString(),
        };
        let newRatings = [...(group.ratings || [])];
        if (existingIdx >= 0) {
          newRatings[existingIdx] = newRating;
        } else {
          newRatings.push(newRating);
        }
        set({
          groups: groups.map(g => g.id === groupId ? { ...g, ratings: newRatings } : g),
        });
        return true;
      },

      getGroup: (groupId) => {
        return get().groups.find(g => g.id === groupId);
      },
    }),
    {
      name: 'laphieu-storage',
      partialize: (state) => ({
        registeredUsers: state.registeredUsers,
        groups: state.groups,
        logs: state.logs,
        adminKeys: state.adminKeys,
      }),
    }
  )
);
