import { signal, createAnimatedValue, easings } from "philjs-core";

export function AnimationDemo() {
  const position = createAnimatedValue(0, {
    easing: { stiffness: 0.1, damping: 0.7 },
  });

  const animate = () => {
    const target = position.value === 0 ? 200 : 0;
    position.set(target);
  };

  return (
    <div>
      <button
        onClick={animate}
        style={{
          width: '100%',
          padding: '0.75rem',
          fontSize: '1rem',
          background: '#764ba2',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          marginBottom: '1rem'
        }}
      >
        Animate with Spring Physics
      </button>

      <div style={{
        height: '100px',
        background: '#f0f0f0',
        borderRadius: '8px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          left: `${position.value}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '50px',
          height: '50px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          transition: 'none'
        }} />
      </div>

      <p style={{
        marginTop: '1rem',
        color: '#666',
        fontSize: '0.9rem',
        textAlign: 'center'
      }}>
        Spring physics with natural motion
      </p>
    </div>
  );
}