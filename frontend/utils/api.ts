const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  status: string;
  locked: boolean;
  created_at: string;
  language: string;
  total_checkins: number;
  completed_checkins: number;
}

export interface DailyCheckIn {
  id: string;
  challenge_id: string;
  date: string;
  completed: boolean;
  notes?: string;
  created_at: string;
}

export interface ChallengeCreate {
  title: string;
  description: string;
  reward: string;
  duration_days: number;
  language: string;
}

export interface CheckInCreate {
  completed: boolean;
  notes?: string;
}

class API {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${BACKEND_URL}/api`;
  }

  async createChallenge(data: ChallengeCreate): Promise<Challenge> {
    const response = await fetch(`${this.baseUrl}/challenges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create challenge');
    return response.json();
  }

  async getChallenges(status?: string): Promise<Challenge[]> {
    const url = status
      ? `${this.baseUrl}/challenges?status=${status}`
      : `${this.baseUrl}/challenges`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch challenges');
    return response.json();
  }

  async getChallenge(id: string): Promise<Challenge> {
    const response = await fetch(`${this.baseUrl}/challenges/${id}`);
    if (!response.ok) throw new Error('Failed to fetch challenge');
    return response.json();
  }

  async lockChallenge(id: string): Promise<Challenge> {
    const response = await fetch(`${this.baseUrl}/challenges/${id}/lock`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to lock challenge');
    return response.json();
  }

  async deleteChallenge(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/challenges/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete challenge');
  }

  async createCheckIn(challengeId: string, data: CheckInCreate): Promise<DailyCheckIn> {
    const response = await fetch(`${this.baseUrl}/challenges/${challengeId}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create check-in');
    }
    return response.json();
  }

  async getCheckIns(challengeId: string): Promise<DailyCheckIn[]> {
    const response = await fetch(`${this.baseUrl}/challenges/${challengeId}/checkins`);
    if (!response.ok) throw new Error('Failed to fetch check-ins');
    return response.json();
  }

  async getTodayCheckIn(challengeId: string): Promise<DailyCheckIn | null> {
    const response = await fetch(`${this.baseUrl}/challenges/${challengeId}/today-checkin`);
    if (!response.ok) return null;
    return response.json();
  }

  async submitJudgment(challengeId: string, wasHonest: boolean): Promise<Challenge> {
    const response = await fetch(`${this.baseUrl}/challenges/${challengeId}/judgment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ was_honest: wasHonest }),
    });
    if (!response.ok) throw new Error('Failed to submit judgment');
    return response.json();
  }
}

export const api = new API();
