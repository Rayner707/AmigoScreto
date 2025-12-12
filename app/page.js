'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const DEFAULT_MESSAGE =
  'Accede con el enlace único que te compartieron y confirma tu nombre para revelar tu amigo secreto.';

export default function HomePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t') || '';

  const [nameInput, setNameInput] = useState('');
  const [status, setStatus] = useState(DEFAULT_MESSAGE);
  const [statusTone, setStatusTone] = useState('muted');
  const [rouletteLabel, setRouletteLabel] = useState('Listo para girar');
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);

  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const updateStatus = (message, tone = 'muted') => {
    setStatus(message);
    setStatusTone(tone);
  };

  const handleSpin = async () => {
    if (spinning) return;
    if (!token) {
      updateStatus('Este enlace no es válido. Pide el enlace correcto.', 'error');
      return;
    }
    if (!nameInput.trim()) {
      updateStatus('Escribe tu nombre para confirmar.', 'error');
      return;
    }

    setResult(null);
    setSpinning(true);
    setRouletteLabel('Girando...');
    updateStatus('Validando enlace y nombre...');

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const randomWord = ['Suerte', 'Sigilo', 'Misterio', 'Azar', 'Ruleta'][Math.floor(Math.random() * 5)];
      setRouletteLabel(randomWord);
    }, 140);

    try {
      const resp = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: nameInput })
      });

      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        throw new Error(data.error || 'No se pudo asignar.');
      }

      setResult({
        receiver: data.receiver,
        alreadyClaimed: data.alreadyClaimed
      });
      setRouletteLabel('¡Listo!');
      updateStatus(data.alreadyClaimed ? 'Ya habías revelado tu amigo secreto.' : 'Asignación confirmada.');
    } catch (error) {
      updateStatus(error.message || 'No se pudo asignar.', 'error');
    } finally {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setSpinning(false);
    }
  };

  const infoMessage = token
    ? 'Confirma tu nombre para revelar tu amigo secreto. Solo podrás ver tu resultado.'
    : 'Necesitas entrar desde tu enlace único para jugar.';

  return (
    <main className="page">
      <div className="shell">
        <header className="header">
          <div>
            <h1>Ruleta de Amigo Secreto</h1>
            <p className="subtitle">{infoMessage}</p>
          </div>
        </header>

        <section className="grid">
          <div className="card">
            <h2>Tu acceso</h2>
            <div className="fields">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSpin();
                }}
                type="text"
                placeholder="Escribe tu nombre para confirmar"
              />
              <button className="primary" onClick={handleSpin} disabled={spinning}>
                {spinning ? 'Girando...' : 'Girar ruleta'}
              </button>
            </div>
            <div className="actions">
              <p className={`notice ${statusTone === 'error' ? 'error' : ''}`}>{status}</p>
            </div>
          </div>

          <div className="card roulette">
            <div className="pointer" />
            <div className={`disc ${spinning ? 'spin' : ''}`}>
              <div className="roulette-label">{rouletteLabel}</div>
            </div>
            <div className="result-box">
              {result && (
                <div className="pair">
                  <div>
                    <strong>Tu amigo secreto:</strong>
                    <div>{result.receiver}</div>
                  </div>
                  <span className="pill tiny">{result.alreadyClaimed ? 'Ya revelado' : 'Asignado'}</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
