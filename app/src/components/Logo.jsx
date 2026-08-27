export default function Logo({ onClick }) {
  return (
    <div className="logo" onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' && onClick) onClick() }}>
      <img src="/luxio.png" alt="Luxio" className="logo-img" draggable={false} />
      <span className="logo-text">Luxio</span>
    </div>
  )
}