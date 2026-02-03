// 기본 아이콘 목록 (호환성 좋은 이모지만 사용)
export const DEFAULT_ICONS = [
  // 동물
  { id: 'cat', icon: '🐱', label: '고양이' },
  { id: 'dog', icon: '🐶', label: '강아지' },
  { id: 'rabbit', icon: '🐰', label: '토끼' },
  { id: 'bear', icon: '🐻', label: '곰' },
  { id: 'fox', icon: '🦊', label: '여우' },
  { id: 'panda', icon: '🐼', label: '판다' },
  { id: 'lion', icon: '🦁', label: '사자' },
  { id: 'tiger', icon: '🐯', label: '호랑이' },
  { id: 'wolf', icon: '🐺', label: '늑대' },
  { id: 'dragon', icon: '🐲', label: '용' },
  { id: 'unicorn', icon: '🦄', label: '유니콘' },
  { id: 'bird', icon: '🐦', label: '새' },
  { id: 'owl', icon: '🦉', label: '부엉이' },
  { id: 'penguin', icon: '🐧', label: '펭귄' },
  // 오브젝트
  { id: 'fire', icon: '🔥', label: '불꽃' },
  { id: 'sun', icon: '☀️', label: '태양' },
  { id: 'moon', icon: '🌙', label: '달' },
  { id: 'star', icon: '⭐', label: '별' },
  { id: 'rainbow', icon: '🌈', label: '무지개' },
  { id: 'diamond', icon: '💎', label: '다이아' },
  { id: 'heart', icon: '❤️', label: '하트' },
  { id: 'crown', icon: '♕', label: '왕관' },
  { id: 'maple', icon: '🍁', label: '단풍잎' },
  { id: 'clover', icon: '🍀', label: '클로버' },
];

// 아이콘 ID로 이모지 가져오기
export function getIconEmoji(iconId) {
  if (!iconId) return '👤';
  const found = DEFAULT_ICONS.find(i => i.id === iconId);
  return found ? found.icon : '👤';
}

// 유저 아바타 컴포넌트
export default function UserAvatar({ user, size = 'medium', className = '' }) {
  const sizeClass = {
    small: 'avatar-sm',
    medium: 'avatar-md',
    large: 'avatar-lg',
  }[size] || 'avatar-md';

  const hasImage = user?.profile_image;
  const hasIcon = user?.default_icon;
  const zoom = user?.profile_zoom || '1';

  return (
    <div className={`user-avatar ${sizeClass} ${className} ${hasIcon && !hasImage ? 'has-icon' : ''}`}>
      {hasImage ? (
        <img src={user.profile_image} alt="" style={{ transform: `scale(${zoom})` }} />
      ) : hasIcon ? (
        <span className="avatar-emoji">{getIconEmoji(user.default_icon)}</span>
      ) : (
        <span className="avatar-emoji">👤</span>
      )}
    </div>
  );
}
