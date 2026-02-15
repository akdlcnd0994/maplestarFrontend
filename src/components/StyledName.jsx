/**
 * StyledName - 커스터마이징된 유저 닉네임 표시
 * 모든 페이지에서 유저 이름을 표시할 때 사용
 */
export default function StyledName({ user, className = '', showTitle = true }) {
  if (!user) return null;

  const name = user.character_name || user.username || '익명';
  const nameColor = user.active_name_color;
  const title = user.active_title;

  const nameStyle = {};
  let nameClass = `styled-name ${className}`;

  if (nameColor === 'rainbow') {
    nameClass += ' rainbow-name';
  } else if (nameColor) {
    nameStyle.color = nameColor;
  }

  return (
    <span className={nameClass}>
      {showTitle && title && (
        <span className="user-title-badge">{title}</span>
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
