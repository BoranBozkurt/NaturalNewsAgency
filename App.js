import { useState } from 'react';
import './App.css';

function App() {
  const [mesaj, setMesaj] = useState('');
  const [gelenler, setGelenler] = useState([]);

  const mesajGonder = async () => {
    if (!mesaj.trim()) return;

    try {
      const res = await fetch('http://localhost:3001/api/gonder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mesaj })
      });

      if (!res.ok) throw new Error("Sunucu hatası: " + res.status);

      const data = await res.json();
      setGelenler(data.analizler);
      setMesaj('');
    } catch (err) {
      console.error('Hata:', err.message);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      mesajGonder();
    }
  };

  return (
    <div className="container">
      <div className="logo">🌐<span>NEWS</span></div>
      <h1 className="title">NATURAL<br />NEWS AGENCY</h1>

      <div className="input-area">
        <input
          type="text"
          value={mesaj}
          onChange={(e) => setMesaj(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Analiz etmek istediğin haber başlığını yaz..."
        />
        <div className="send-btn" onClick={mesajGonder}>▲</div>
      </div>

      <div style={{ marginTop: '40px', width: '80%', color: '#fff' }}>
        <h3>📰 Haber Analizleri</h3>
        {gelenler.map((h, i) => (
          <div key={i} style={{ background: '#222', marginBottom: '15px', padding: '10px', borderRadius: '5px' }}>
            <strong>🔗 <a href={h.url} target="_blank" rel="noreferrer" style={{ color: '#0bf' }}>{h.url}</a></strong>
            <p><strong>Sağcı:</strong> {(h.sag * 100).toFixed(1)}% | <strong>Solcu:</strong> {(h.sol * 100).toFixed(1)}%</p>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{h.summary}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
