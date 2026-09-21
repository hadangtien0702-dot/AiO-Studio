/**
 * AiO Isometric USA Map - Interview & Production Manager
 * Handles client interview tracking, storage (localStorage), CRUD, and stats.
 * Strictly NO emojis. Pure inline SVGs.
 */

const SAMPLE_INTERVIEWS = [
  {
    id: 'int-001',
    stateCode: 'CA',
    clientName: 'David Miller',
    role: 'VP of Production',
    company: 'Silicon Media Labs',
    city: 'Los Angeles',
    date: '2026-08-14',
    status: 'completed',
    videoLink: 'PR-SEQ-LA01',
    notes: 'Interview about AI post-production workflows, Premiere timeline automation, and color finishing.'
  },
  {
    id: 'int-002',
    stateCode: 'CA',
    clientName: 'Elena Rostova',
    role: 'Head of Post-Production',
    company: 'Pacific Coast Films',
    city: 'San Francisco',
    date: '2026-08-18',
    status: 'completed',
    videoLink: 'PR-SEQ-SF02',
    notes: 'In-depth case study on multi-cam editing and auto-captioning integrations.'
  },
  {
    id: 'int-003',
    stateCode: 'TX',
    clientName: 'Marcus Sterling',
    role: 'Creative Director',
    company: 'Austin Hub Studios',
    city: 'Austin',
    date: '2026-08-26',
    status: 'completed',
    videoLink: 'PR-SEQ-ATX01',
    notes: 'Discussed short-form video explosion and high-velocity daily reels editing.'
  },
  {
    id: 'int-004',
    stateCode: 'TX',
    clientName: 'Samantha Hayes',
    role: 'Lead Podcast Producer',
    company: 'Lone Star Media',
    city: 'Dallas',
    date: '2026-09-02',
    status: 'completed',
    videoLink: 'PR-SEQ-DFW02',
    notes: 'Multi-camera podcast workflow with auto-cut switching and transcript sync.'
  },
  {
    id: 'int-005',
    stateCode: 'NY',
    clientName: 'Jonathan Chen',
    role: 'Executive Producer',
    company: 'Manhattan Broadcast Group',
    city: 'New York City',
    date: '2026-09-08',
    status: 'completed',
    videoLink: 'PR-SEQ-NYC01',
    notes: 'Broadcast delivery standards, HDR mastering, and multi-user asset bin management.'
  },
  {
    id: 'int-006',
    stateCode: 'NY',
    clientName: 'Chloe Dupont',
    role: 'Documentary Filmmaker',
    company: 'Brooklyn Independent Docs',
    city: 'Brooklyn',
    date: '2026-09-28',
    status: 'planned',
    videoLink: 'PR-PLAN-BK01',
    notes: 'Upcoming shoot: Archival footage restoration and documentary pacing.'
  },
  {
    id: 'int-007',
    stateCode: 'FL',
    clientName: 'Carlos Rodriguez',
    role: 'Content Director',
    company: 'Miami Sun Media',
    city: 'Miami',
    date: '2026-09-12',
    status: 'completed',
    videoLink: 'PR-SEQ-MIA01',
    notes: 'Commercial ad editing, fast turnarounds for social campaigns.'
  },
  {
    id: 'int-008',
    stateCode: 'WA',
    clientName: 'Rachel Adams',
    role: 'Lead Video Editor',
    company: 'Puget Sound Digital',
    city: 'Seattle',
    date: '2026-09-17',
    status: 'completed',
    videoLink: 'PR-SEQ-SEA01',
    notes: 'Cloud proxy workflows and collaboration between dispersed video editors.'
  }
];

const STORAGE_KEY = 'aio_studio_map_interviews_v1';

class InterviewManager {
  constructor() {
    this.interviews = this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read interviews from localStorage, falling back to sample data.', e);
    }
    // Initialize with sample data
    this.saveToStorage(SAMPLE_INTERVIEWS);
    return [...SAMPLE_INTERVIEWS];
  }

  saveToStorage(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save interviews to localStorage:', e);
    }
  }

  getAll() {
    return [...this.interviews];
  }

  getByState(stateCode) {
    if (!stateCode) return [];
    return this.interviews.filter(i => i.stateCode === stateCode);
  }

  getById(id) {
    return this.interviews.find(i => i.id === id);
  }

  getFilmedStateCodes() {
    const codes = new Set();
    this.interviews.forEach(i => {
      if (i.stateCode) codes.add(i.stateCode);
    });
    return Array.from(codes);
  }

  getStats() {
    const total = this.interviews.length;
    const completed = this.interviews.filter(i => i.status === 'completed').length;
    const planned = this.interviews.filter(i => i.status === 'planned').length;
    const statesCovered = this.getFilmedStateCodes().length;
    return { total, completed, planned, statesCovered };
  }

  add(record) {
    const newRecord = Object.assign({
      id: 'int-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      stateCode: '',
      clientName: '',
      role: '',
      company: '',
      city: '',
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      videoLink: '',
      notes: ''
    }, record);

    this.interviews.unshift(newRecord);
    this.saveToStorage(this.interviews);
    return newRecord;
  }

  update(id, updatedFields) {
    const idx = this.interviews.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.interviews[idx] = Object.assign({}, this.interviews[idx], updatedFields);
      this.saveToStorage(this.interviews);
      return this.interviews[idx];
    }
    return null;
  }

  delete(id) {
    const idx = this.interviews.findIndex(i => i.id === id);
    if (idx !== -1) {
      const removed = this.interviews.splice(idx, 1)[0];
      this.saveToStorage(this.interviews);
      return removed;
    }
    return null;
  }

  exportJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.interviews, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `AiO-US-Interview-Log-${Date.now()}.json`);
    dlAnchor.click();
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        this.interviews = parsed;
        this.saveToStorage(this.interviews);
        return true;
      }
    } catch (e) {
      console.error('Invalid JSON format:', e);
    }
    return false;
  }
}

window.InterviewManager = InterviewManager;
