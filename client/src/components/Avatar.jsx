export default function Avatar({ name, photoUrl, size = 40, className = '' }) {
  const initials = name ? name.slice(0, 2) : '??'
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
        className={className}
      />
    )
  }
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', fontSize: size * 0.36,
        background: 'linear-gradient(135deg, var(--accent), var(--sub))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, flexShrink: 0
      }}
      className={className}
    >
      {initials}
    </div>
  )
}
