import React, { useState } from 'react';
import { 
  Camera, Upload, CheckCircle2, AlertCircle, FileText, 
  ArrowRight, ShieldCheck, MessageCircle, Clock, X, Smartphone 
} from 'lucide-react';

// === CONFIGURAÇÃO DA IA ===
// Cole a sua chave do Google Gemini aqui para a validação funcionar
const apiKey = ""; 

const App = () => {
  const [etapa, setEtapa] = useState('inicio');
  const [cidade, setCidade] = useState('');
  const [arquivos, setArquivos] = useState({});
  const [analisando, setAnalisando] = useState(null);
  const [mensagemErro, setMensagemErro] = useState('');

  // Lista de documentos necessários
  const documentosNecessarios = [
    { id: 'rg_cnh', nome: 'RG ou CNH (Frente e Verso)', obrigatorio: true },
    { id: 'comprovante_residencia', nome: 'Comprovante de Residência', obrigatorio: true },
    { id: 'titulo_eleitor', nome: 'Título de Eleitor', obrigatorio: true },
    { id: 'carteira_trabalho', nome: 'CTPS Digital (Print)', obrigatorio: true },
  ];

  // Função para validar o documento usando a API do Gemini
  const validarDocumentoComIA = async (base64Image, nomeDoc) => {
    if (!apiKey) return { valido: true, motivo: "Modo de teste (sem chave API)" };

    try {
      const prompt = `Você é um assistente de RH. Analise esta imagem. 
      O candidato deve enviar um(a) ${nomeDoc}. 
      Responda apenas em JSON: {"valido": boolean, "motivo": "string curta"}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
            ]
          }]
        })
      });

      const data = await response.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(resultText.replace(/```json|```/g, ''));
    } catch (error) {
      console.error("Erro na IA:", error);
      return { valido: true, motivo: "Erro técnico, revisão manual necessária" };
    }
  };

  const handleFileUpload = async (id, file, nomeDoc) => {
    setAnalisando(id);
    setMensagemErro('');

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      const resultado = await validarDocumentoComIA(base64, nomeDoc);

      if (resultado.valido) {
        setArquivos(prev => ({ ...prev, [id]: { file, preview: base64, status: 'success' } }));
      } else {
        setMensagemErro(`Documento Inválido: ${resultado.motivo}`);
      }
      setAnalisando(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-indigo-700 text-white p-4 sticky top-0 z-50 shadow-lg flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Smartphone size={20} />
          <span className="font-bold tracking-tight">ADMISSÃO DIGITAL</span>
        </div>
        <a 
          href="https://wa.me/5521998280643" 
          target="_blank" 
          rel="noreferrer"
          className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-transform active:scale-95"
        >
          <MessageCircle size={16} /> SUPORTE
        </a>
      </header>

      <main className="max-w-md mx-auto p-4 pt-8">
        {etapa === 'inicio' ? (
          <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
            <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mb-6">
              <ShieldCheck size={40} className="text-indigo-600" />
            </div>
            <h1 className="text-3xl font-black text-indigo-900 leading-tight">Olá, bem-vindo!</h1>
            <p className="text-slate-500 mt-4 leading-relaxed">Para começar o processo, envie os seus documentos.</p>
            
            <div className="mt-8">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cidade de Atuação</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl mt-2 outline-none focus:ring-2 ring-indigo-500 transition-all appearance-none"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              >
                <option value="">Selecione...</option>
                <option value="rj">Rio de Janeiro</option>
                <option value="sp">São Paulo</option>
                <option value="bh">Belo Horizonte</option>
              </select>
            </div>

            <button 
              disabled={!cidade}
              onClick={() => setEtapa('documentos')}
              className="w-full bg-indigo-600 disabled:bg-slate-200 text-white p-5 rounded-2xl font-black text-lg mt-8 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              COMEÇAR <ArrowRight size={20} />
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="bg-indigo-900 p-6 rounded-[2rem] text-white shadow-lg relative overflow-hidden">
               <h2 className="text-xl font-bold">Documentos</h2>
               <p className="text-indigo-200 text-sm">Faltam {documentosNecessarios.length - Object.keys(arquivos).length} itens</p>
               <FileText className="absolute -right-4 -bottom-4 text-white/5" size={100} />
            </div>

            {mensagemErro && (
              <div className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-bounce">
                <AlertCircle size={20} /> {mensagemErro}
              </div>
            )}

            <div className="grid gap-3">
              {documentosNecessarios.map((doc) => (
                <div key={doc.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${arquivos[doc.id] ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                    {arquivos[doc.id] ? <CheckCircle2 size={24} /> : <Camera size={24} />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-slate-800">{doc.nome}</h3>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Original com foto</p>
                  </div>
                  {analisando === doc.id ? (
                    <Clock size={20} className="animate-spin text-indigo-500" />
                  ) : arquivos[doc.id] ? (
                    <button onClick={() => setArquivos(prev => { const n = {...prev}; delete n[doc.id]; return n; })} className="text-slate-300 hover:text-red-500"><X size={20}/></button>
                  ) : (
                    <label className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold text-xs cursor-pointer hover:bg-indigo-100 transition-all">
                      FOTOGRAFAR
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileUpload(doc.id, e.target.files[0], doc.nome)} />
                    </label>
                  )}
                </div>
              ))}
            </div>

            <button 
              disabled={Object.keys(arquivos).length < documentosNecessarios.length}
              className="w-full bg-indigo-600 disabled:bg-slate-200 text-white p-5 rounded-2xl font-black text-lg mt-4 shadow-xl active:scale-95 transition-all"
              onClick={() => setEtapa('sucesso')}
            >
              FINALIZAR ENVIO
            </button>
          </div>
        )}

        {etapa === 'sucesso' && (
          <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95">
             <div className="w-24 h-24 bg-green-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-green-200 mb-8">
                <CheckCircle2 size={50} className="text-white" />
             </div>
             <h2 className="text-3xl font-black text-slate-800">Sucesso!</h2>
             <p className="text-slate-500 mt-4 leading-relaxed">Os seus documentos foram enviados com sucesso.</p>
             <button onClick={() => window.location.reload()} className="mt-10 text-indigo-600 font-bold">Voltar ao Início</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
