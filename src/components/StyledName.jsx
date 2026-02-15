/**
 * StyledName - 커스터마이징된 유저 닉네임 표시
 * 지원 포맷: #hex(단색), gradient:c1,c2(그라데이션), glow:color(발광), rainbow/aurora/hologram/inferno/galaxy(애니메이션)
 */
export default function StyledName({ user, className = '', showTitle = true }) {
  if (!user) return null;

  const name = user.character_name || user.username || '익명';
  const nameColor = user.active_name_color;
  const title = user.active_title;
  const titleRarity = user.active_title_rarity;

  const nameStyle = {};
  let nameClass = `styled-name ${className}`;

  if (nameColor) {
    if (nameColor === 'rainbow') {
      nameClass += ' rainbow-name';
    } else if (nameColor === 'aurora') {
      nameClass += ' aurora-name';
    } else if (nameColor === 'hologram') {
      nameClass += ' hologram-name';
    } else if (nameColor === 'inferno') {
      nameClass += ' inferno-name';
    } else if (nameColor === 'galaxy') {
      nameClass += ' galaxy-name';
    } else if (nameColor.startsWith('gradient:')) {
      const colors = nameColor.slice(9).split(',');
      nameStyle.background = `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`;
      nameStyle.WebkitBackgroundClip = 'text';
      nameStyle.WebkitTextFillColor = 'transparent';
      nameStyle.backgroundClip = 'text';
    } else if (nameColor.startsWith('glow:')) {
      const glowColor = nameColor.slice(5);
      nameStyle.color = glowColor;
      nameStyle.textShadow = `0 0 6px ${glowColor}, 0 0 12px ${glowColor}, 0 0 20px ${glowColor}40`;
      nameClass += ' glow-name';
    } else if (nameColor.startsWith('#')) {
      nameStyle.color = nameColor;
    }
  }

  return (
    <span className={nameClass}>
      {showTitle && title && (
        <span className={`user-title-badge ${titleRarity ? `title-${titleRarity}` : ''}`}>{title}</span>
      )}
      <span className="styled-name-text" style={nameStyle}>{name}</span>
    </span>
  );
}

/**
 * ProfileFrame - 프로필 이미지 프레임
 */
export function ProfileFrame({ user, children, size = 'md' }) {
  const frame = user?.active_frame;

  return (
    <span className={`profile-frame frame-${frame || 'none'} frame-size-${size}`}>
      {children}
    </span>
  );
}
