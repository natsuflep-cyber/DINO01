import { useState, useRef } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

export default function Home() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [cortes, setCortes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [statusTexto, setStatusTexto] = useState('');
  
  const ffmpegRef = useRef(null);
  const videoRef = useRef(null);

  const iniciarFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    const ffmpeg = createFFmpeg({ log: true });
    setStatusTexto('A iniciar motor de vídeo...');
    await ffmpeg.load();
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setCortes([]);
      const url = URL.createObjectURL(file);
      if (videoRef.current) videoRef.current.src = url;
    }
  };

  const handleMetadata = (e) => {
    setVideoDuration(e.target.duration);
  };

  const processarCortesInteligentes = async () => {
    if (!videoFile) return;
    setCarregando(true);
    
    try {
      const ffmpeg = await iniciarFFmpeg();
      setStatusTexto('A analisar duração exata...');
      
      ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile));

      const duracaoTotal = videoDuration;
      let tempoPorCorte = 61; // Padrão mínimo de segurança para o TikTok (1min e 1s)
      let totalCortes = Math.floor(duracaoTotal / tempoPorCorte);

      if (totalCortes > 0) {
        tempoPorCorte = duracaoTotal / totalCortes;
      } else {
        totalCortes = 1;
        tempoPorCorte = duracaoTotal;
      }

      const listaDeCortes = [];

      for (let i = 0; i < totalCortes; i++) {
        const tempoInicio = i * tempoPorCorte;
        const nomeSaida = `corte_${i + 1}.mp4`;
        
        setStatusTexto(`A extrair Parte ${i + 1} de ${totalCortes} (${Math.round(tempoPorCorte)}s)...`);

        await ffmpeg.run(
          '-ss', tempoInicio.toString(),
          '-i', 'input.mp4',
          '-t', tempoPorCorte.toString(),
          '-c', 'copy',
          nomeSaida
        );

        const data = ffmpeg.FS('readFile', nomeSaida);
        const urlLink = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
        
        listaDeCortes.push({
          id: i + 1,
          nome: `Parte ${i + 1} de ${totalCortes}`,
          duracao: `${Math.floor(tempoPorCorte / 60)}m ${Math.round(tempoPorCorte % 60)}s`,
          url: urlLink
        });
      }

      setCortes(listaDeCortes);
      setStatusTexto('Vídeo fatiado com 100% de aproveitamento!');
    } catch (erro) {
      console.error(erro);
      alert('FUNCIONAMOS APENAS EM PC.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#09090b', color: '#f4f4f5', minHeight: '100vh', fontFamily: 'sans-serif', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: '600px', width: '100%', backgroundColor: '#18181b', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid #27273a' }}>
        
        <h1 style={{ color: '#a855f7', textAlign: 'center', marginBottom: '10px' }}>TikTok Smart Cutter 🎬</h1>
        <p style={{ textAlign: 'center', color: '#a1a1aa', fontSize: '14px', marginBottom: '30px' }}>Cortes sem sobras e sem perda de qualidade. Foco total em Monetização.</p>

        <div style={{ border: '2px dashed #a855f7', borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '20px', backgroundColor: '#27273a' }}>
          <input type="file" accept="video/*" onChange={handleVideoChange} style={{ display: 'block', margin: '0 auto', color: '#f4f4f5' }} />
        </div>

        <video ref={videoRef} onLoadedMetadata={handleMetadata} controls style={{ width: '100%', borderRadius: '8px', marginBottom: '20px', display: videoFile ? 'block' : 'none' }} />

        {videoDuration > 0 && (
          <p style={{ color: '#e4e4e7', fontSize: '14px', backgroundColor: '#27273a', padding: '10px', borderRadius: '6px' }}>
            ⏱️ Duração detetada: <strong>{Math.floor(videoDuration / 60)} minutos e {Math.round(videoDuration % 60)} segundos</strong>
          </p>
        )}

        <button 
          onClick={processarCortesInteligentes} 
          disabled={!videoFile || carregando}
          style={{ width: '100%', padding: '15px', border: 'none', borderRadius: '8px', backgroundColor: '#a855f7', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', opacity: (!videoFile || carregando) ? 0.5 : 1, transition: '0.2s' }}
        >
          {carregando ? 'Cortando sem perder nada...' : 'Gerar Cortes Perfeitos'}
        </button>

        {carregando && (
          <div style={{ marginTop: '20px', textAlign: 'center', color: '#a855f7' }}>
            <div style={{ border: '3px solid rgba(168,85,247,0.2)', borderLeftColor: '#a855f7', width: '30px', height: '30px', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px auto' }}></div>
            <p style={{ fontSize: '14px' }}>{statusTexto}</p>
          </div>
        )}

        {cortes.length > 0 && (
          <div style={{ marginTop: '30px', borderTop: '1px solid #27273a', paddingTop: '20px' }}>
            <h3 style={{ color: '#22c55e', marginBottom: '15px' }}>✨ Partes Geradas (Prontas para Monetizar):</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {cortes.map((corte) => (
                <div key={corte.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#27272a', padding: '12px 15px', borderRadius: '8px', border: '1px solid #3f3f46' }}>
                  <div>
                    <span style={{ display: 'block', fontWeight: 'bold' }}>🎬 {corte.nome}</span>
                    <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Duração: {corte.duracao}</span>
                  </div>
                  <a href={corte.url} download={corte.nome + '.mp4'} style={{ backgroundColor: '#22c55e', color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>Baixar MP4</a>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
