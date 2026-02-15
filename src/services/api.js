const API_BASE = import.meta.env.VITE_API_URL || '/api';

// 이미지 URL을 전체 API URL로 변환
export const getImageUrl = (url) => {
  if (!url) return '';
  // 이미 전체 URL인 경우
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // /api/images/... 형태인 경우 API 베이스 URL로 변환
  if (url.startsWith('/api/')) {
    const apiOrigin = API_BASE.endsWith('/api')
      ? API_BASE.slice(0, -4)
      : API_BASE.replace(/\/api$/, '');
    return apiOrigin + url;
  }
  return url;
};

// 세션 만료 이벤트
const SESSION_EXPIRED_EVENT = 'session-expired';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // 세션 만료 이벤트 리스너 등록
  onSessionExpired(callback) {
    window.addEventListener(SESSION_EXPIRED_EVENT, callback);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, callback);
  }

  // 세션 만료 알림
  notifySessionExpired() {
    this.setToken(null);
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers = {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('서버 응답을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.');
    }

    if (!data.success) {
      // 세션 만료 처리
      if (data.error?.code === 'SESSION_EXPIRED' || data.error?.code === 'INVALID_TOKEN') {
        this.notifySessionExpired();
      }
      throw new Error(data.error?.message || 'API 요청 실패');
    }

    return data;
  }

  // Auth
  async login(username, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (res.data?.token) {
      this.setToken(res.data.token);
    }
    return res;
  }

  async signup(userData) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    this.setToken(null);
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async uploadProfileImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/auth/profile/image', {
      method: 'POST',
      body: formData,
    });
  }

  // 내 활동 조회
  async getMyPosts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/auth/my-posts?${query}`);
  }

  async getMyComments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/auth/my-comments?${query}`);
  }

  async getMyGallery(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/auth/my-gallery?${query}`);
  }

  async getMyEvents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/auth/my-events?${query}`);
  }

  // 갤러리 수정
  async updateGallery(id, data) {
    return this.request(`/gallery/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 가입 대기 목록 (관리자)
  async getPendingMembers() {
    return this.request('/members?pending=true');
  }

  // 멤버 삭제 (관리자)
  async deleteMember(id) {
    return this.request(`/members/${id}`, {
      method: 'DELETE',
    });
  }

  // Posts
  async getPosts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/posts?${query}`);
  }

  async getPost(id) {
    return this.request(`/posts/${id}`);
  }

  async createPost(postData) {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async updatePost(id, postData) {
    return this.request(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  }

  async deletePost(id) {
    return this.request(`/posts/${id}`, {
      method: 'DELETE',
    });
  }

  async likePost(id) {
    return this.request(`/posts/${id}/like`, {
      method: 'POST',
    });
  }

  async uploadPostImages(postId, files) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.request(`/posts/${postId}/images`, {
      method: 'POST',
      body: formData,
    });
  }

  async getComments(postId) {
    return this.request(`/posts/${postId}/comments`);
  }

  async createComment(postId, content, parentId = null) {
    return this.request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    });
  }

  async deleteComment(postId, commentId) {
    return this.request(`/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Gallery
  async getGallery(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/gallery?${query}`);
  }

  async uploadGallery(title, file, description = '') {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('file', file);
    return this.request('/gallery', {
      method: 'POST',
      body: formData,
    });
  }

  async deleteGallery(id) {
    return this.request(`/gallery/${id}`, {
      method: 'DELETE',
    });
  }

  async likeGallery(id) {
    return this.request(`/gallery/${id}/like`, {
      method: 'POST',
    });
  }

  // Attendance
  async getAttendance() {
    return this.request('/attendance');
  }

  async getAttendanceByMonth(year, month) {
    return this.request(`/attendance?year=${year}&month=${month}`);
  }

  async checkAttendance() {
    return this.request('/attendance/check', {
      method: 'POST',
    });
  }

  async getAttendanceStats() {
    return this.request('/attendance/stats');
  }

  async getAttendanceRanking(year, month) {
    const params = year && month ? `?year=${year}&month=${month}` : '';
    return this.request(`/attendance/ranking${params}`);
  }

  async getAttendanceBenefits(year, month) {
    const params = year && month ? `?year=${year}&month=${month}` : '';
    return this.request(`/attendance/benefits${params}`);
  }

  async saveAttendanceBenefits(benefitData) {
    return this.request('/attendance/benefits', {
      method: 'POST',
      body: JSON.stringify(benefitData),
    });
  }

  async getAllUsersAttendance(year, month) {
    return this.request(`/attendance/admin/users?year=${year}&month=${month}`);
  }

  // Members
  async getMembers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/members?${query}`);
  }

  async approveMember(id) {
    return this.request(`/members/${id}/approve`, {
      method: 'PUT',
    });
  }

  async updateMemberRole(id, role) {
    return this.request(`/members/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async updateMemberProfile(id, { job, level }) {
    return this.request(`/members/${id}/profile`, {
      method: 'PUT',
      body: JSON.stringify({ job, level }),
    });
  }

  // Alliances
  async getAlliances() {
    return this.request('/alliances');
  }

  async getAlliance(id) {
    return this.request(`/alliances/${id}`);
  }

  async createAlliance(allianceData) {
    return this.request('/alliances', {
      method: 'POST',
      body: JSON.stringify(allianceData),
    });
  }

  async updateAlliance(id, allianceData) {
    return this.request(`/alliances/${id}`, {
      method: 'PUT',
      body: JSON.stringify(allianceData),
    });
  }

  async deleteAlliance(id) {
    return this.request(`/alliances/${id}`, {
      method: 'DELETE',
    });
  }

  // Events
  async getEvents() {
    return this.request('/events');
  }

  async getEvent(id) {
    return this.request(`/events/${id}`);
  }

  async joinEvent(id) {
    return this.request(`/events/${id}/join`, {
      method: 'POST',
    });
  }

  async getEventParticipants(id) {
    return this.request(`/events/${id}/participants`);
  }

  async createEvent(eventData) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(id, eventData) {
    return this.request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(id) {
    return this.request(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  // Notices
  async getNotices() {
    return this.request('/notices');
  }

  async createNotice(noticeData) {
    return this.request('/notices', {
      method: 'POST',
      body: JSON.stringify(noticeData),
    });
  }

  async updateNotice(id, noticeData) {
    return this.request(`/notices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(noticeData),
    });
  }

  async deleteNotice(id) {
    return this.request(`/notices/${id}`, {
      method: 'DELETE',
    });
  }

  // Register (가입 신청)
  async submitRegister(registerData) {
    const formData = new FormData();
    Object.keys(registerData).forEach(key => {
      if (registerData[key] !== null && registerData[key] !== undefined) {
        formData.append(key, registerData[key]);
      }
    });
    return this.request('/auth/register', {
      method: 'POST',
      body: formData,
    });
  }

  // 게임 API
  async submitGameScore(gameType, score, metadata = {}) {
    return this.request('/games/scores', {
      method: 'POST',
      body: JSON.stringify({ game_type: gameType, score, metadata }),
    });
  }

  async getGameRankings(gameType, limit = 10) {
    return this.request(`/games/rankings/${gameType}?limit=${limit}`);
  }

  async getAllGameRankings() {
    return this.request('/games/rankings');
  }

  async getMyGameScores() {
    return this.request('/games/my-scores');
  }

  // 주문서 시뮬레이터 API
  async getScrollRankings(limit = 50) {
    return this.request(`/scrolls/rankings?limit=${limit}`);
  }

  async getMyScrollRecords() {
    return this.request('/scrolls/my-records');
  }

  async saveScrollRecord(data) {
    return this.request('/scrolls/records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 혼줌 시뮬레이터 API
  async getChaosRankings({ limit = 20, statType = 'total', upgradeCount = null } = {}) {
    let url = `/chaos/rankings?limit=${limit}&stat_type=${statType}`;
    if (upgradeCount) {
      url += `&upgrade_count=${upgradeCount}`;
    }
    return this.request(url);
  }

  async saveChaosRecord(data) {
    return this.request('/chaos/records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 랭킹 초기화 (관리자)
  async resetScrollRankings() {
    return this.request('/scrolls/rankings', {
      method: 'DELETE',
    });
  }

  async resetChaosRankings() {
    return this.request('/chaos/rankings', {
      method: 'DELETE',
    });
  }

  // 부화기 API
  async getIncubatorItems() {
    return this.request('/incubator/items');
  }

  async getIncubatorInventory() {
    return this.request('/incubator/inventory');
  }

  async getIncubatorDailyStats() {
    return this.request('/incubator/daily-stats');
  }

  async hatchIncubator(count = 1, competitionBoost = false) {
    return this.request('/incubator/hatch', {
      method: 'POST',
      body: JSON.stringify({ count, competitionBoost }),
    });
  }

  async getIncubatorHistory(limit = 50) {
    return this.request(`/incubator/history?limit=${limit}`);
  }

  async getIncubatorRankings(limit = 20) {
    return this.request(`/incubator/rankings?limit=${limit}`);
  }

  // 부화기 관리자 API
  async getIncubatorAdminUsers() {
    return this.request('/incubator/admin/users');
  }

  async getIncubatorUserInventory(userId) {
    return this.request(`/incubator/admin/users/${userId}/inventory`);
  }

  async grantIncubatorBonus(userId, amount) {
    return this.request(`/incubator/admin/users/${userId}/bonus`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async revokeIncubatorBonus(userId) {
    return this.request(`/incubator/admin/users/${userId}/revoke-bonus`, {
      method: 'POST',
    });
  }

  async resetIncubatorUser(userId) {
    return this.request(`/incubator/admin/users/${userId}/reset`, {
      method: 'DELETE',
    });
  }

  // 주문서 시뮬레이터용 - 부화기 주문서 인벤토리 조회
  async getScrollInventory() {
    return this.request('/incubator/scroll-inventory');
  }

  // 주문서 시뮬레이터용 - 주문서 사용 (인벤토리에서 차감)
  async useScroll(scrollType, count = 1) {
    return this.request('/incubator/use-scroll', {
      method: 'POST',
      body: JSON.stringify({ scrollType, count }),
    });
  }

  // 경쟁 모드 - 노가다 목장갑 랭킹
  async getCompetitionGloveRankings(limit = 20) {
    return this.request(`/incubator/competition/glove/rankings?limit=${limit}`);
  }

  async saveCompetitionGloveRecord(data) {
    return this.request('/incubator/competition/glove/records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 경쟁 모드 - 혼줌 랭킹
  async getCompetitionChaosRankings(limit = 20, statType = 'atk') {
    return this.request(`/incubator/competition/chaos/rankings?limit=${limit}&stat_type=${statType}`);
  }

  async saveCompetitionChaosRecord(data) {
    return this.request('/incubator/competition/chaos/records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==================== 포인트 API ====================

  async getPointBalance() {
    return this.request('/points/balance');
  }

  async getPointTransactions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/points/transactions?${query}`);
  }

  async getPointDaily() {
    return this.request('/points/daily');
  }

  async getPointRanking(limit = 20) {
    return this.request(`/points/ranking?limit=${limit}`);
  }

  // 포인트 관리자 API
  async getPointConfig() {
    return this.request('/points/admin/config');
  }

  async updatePointConfig(activityType, config) {
    return this.request(`/points/admin/config/${activityType}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async grantPoints(userId, amount, description) {
    return this.request('/points/admin/grant', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, amount, description }),
    });
  }

  async deductPoints(userId, amount, description) {
    return this.request('/points/admin/deduct', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, amount, description }),
    });
  }

  async getPointUsers() {
    return this.request('/points/admin/users');
  }

  async getUserPointTransactions(userId, limit = 50) {
    return this.request(`/points/admin/users/${userId}/transactions?limit=${limit}`);
  }

  async getAuditLog(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/points/admin/audit-log?${query}`);
  }

  // ==================== 교환소 API ====================

  async getShopItems() {
    return this.request('/shop/items');
  }

  async purchaseShopItem(itemId, quantity = 1) {
    return this.request('/shop/purchase', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, quantity }),
    });
  }

  async getShopOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/shop/orders?${query}`);
  }

  // 교환소 관리자 API
  async getAdminShopItems() {
    return this.request('/shop/admin/items');
  }

  async createShopItem(formData) {
    return this.request('/shop/admin/items', {
      method: 'POST',
      body: formData,
    });
  }

  async updateShopItem(id, formData) {
    return this.request(`/shop/admin/items/${id}`, {
      method: 'PUT',
      body: formData,
    });
  }

  async deleteShopItem(id) {
    return this.request(`/shop/admin/items/${id}`, {
      method: 'DELETE',
    });
  }

  async getAdminShopOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/shop/admin/orders?${query}`);
  }

  // ==================== 공지 팝업 API ====================

  async getUnreadAnnouncements() {
    return this.request('/announcements/unread');
  }

  async markAnnouncementRead(id) {
    return this.request(`/announcements/${id}/read`, {
      method: 'POST',
    });
  }

  async getAnnouncements() {
    return this.request('/announcements');
  }

  // 공지 팝업 관리자 API
  async getAdminAnnouncements() {
    return this.request('/announcements/admin/list');
  }

  async createAnnouncement(data) {
    return this.request('/announcements/admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAnnouncement(id, data) {
    return this.request(`/announcements/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAnnouncement(id) {
    return this.request(`/announcements/admin/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== 룰렛 ====================
  async getRoulettePrizes() {
    return this.request('/roulette/prizes');
  }
  async getRouletteFreeSpin() {
    return this.request('/roulette/free-spin');
  }
  async spinRoulette() {
    return this.request('/roulette/spin', { method: 'POST', body: JSON.stringify({}) });
  }
  async getRouletteHistory() {
    return this.request('/roulette/history');
  }

  // ==================== 알림 ====================
  async getNotifications(limit = 30) {
    return this.request(`/notifications?limit=${limit}`);
  }
  async getUnreadNotificationCount() {
    return this.request('/notifications/unread-count');
  }
  async markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }
  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', { method: 'PUT' });
  }

  // ==================== 프로필 꾸미기 ====================
  async getCustomizationItems() {
    return this.request('/customizations/items');
  }
  async getMyCustomizations() {
    return this.request('/customizations/my');
  }
  async purchaseCustomization(itemId) {
    return this.request('/customizations/purchase', { method: 'POST', body: JSON.stringify({ itemId }) });
  }
  async equipCustomization(itemId, equip) {
    return this.request('/customizations/equip', { method: 'PUT', body: JSON.stringify({ itemId, equip }) });
  }
}

export const api = new ApiClient();
