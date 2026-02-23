export default function Modal({ isOpen, onClose, title, children, className, preventOutsideClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={preventOutsideClose ? undefined : onClose}>
      <div className={`modal-content${className ? ' ' + className : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
