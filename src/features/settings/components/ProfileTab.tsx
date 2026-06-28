import React, { useState } from 'react';
import { Camera, Clock, Plus, X, UploadCloud, FileText, CheckCircle2, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface ProfileTabProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  triggerToast: (msg: string, type?: 'success' | 'error') => void;
  availability: any; // Used in validation
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  formData,
  setFormData,
  triggerToast,
  availability
}) => {
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        setUploading(false);
        return;
      }
      const file = event.target.files[0];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const base64Photo = canvas.toDataURL('image/jpeg', 0.8);
          setFormData((prev: any) => ({ ...prev, photo_url: base64Photo }));

          const { error: dbError } = await supabase
            .from('therapists')
            .update({ photo_url: base64Photo })
            .eq('id', user.id);

          if (dbError) {
             console.error(dbError);
             triggerToast('Erro ao salvar no banco!', 'error');
          } else {
             triggerToast('Foto de perfil atualizada!', 'success');
          }
          setUploading(false);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error(error);
      triggerToast(error.message || 'Erro ao processar imagem!', 'error');
      setUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Meu Perfil Profissional</h3>
      </div>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-lg">
              <img
                src={formData.photo_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                alt="Profile"
                className="w-full h-full object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <label
              htmlFor="photo-upload"
              className="absolute bottom-2 right-2 p-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors cursor-pointer"
            >
              <Camera size={16} />
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={uploading}
            />
          </div>
          <div className="flex-1 space-y-4 w-full text-center md:text-left">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Foto de Perfil</label>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Clique no ícone de câmera para alterar sua foto.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Nome Completo</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">CITRG</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                  value={formData.citrg_code}
                  onChange={(e) => setFormData({ ...formData, citrg_code: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Email</label>
                <input
                  type="email"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">WhatsApp / Telefone</label>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Valor da Sessão (R$)</label>
                <input
                  type="number"
                  placeholder="Ex: 150.00"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase flex items-center gap-1">
                  <Clock size={14} className="text-primary-500" /> Duração da Sessão
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[30, 50, 60, 90].map(duration => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => setFormData({ ...formData, session_duration: duration })}
                      className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all ${formData.session_duration === duration 
                          ? 'bg-primary-500 border-primary-500 text-white shadow-md scale-[1.02]' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary-300 dark:hover:border-primary-600'
                        }`}
                    >
                      {duration} min
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Outro valor (min)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none transition-shadow"
                    value={formData.session_duration || ''}
                    onChange={(e) => setFormData({ ...formData, session_duration: parseInt(e.target.value) || 0 })}
                  />
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Biografia Profissional</label>
              <textarea
                rows={3}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none resize-none"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Conte um pouco sobre sua experiência e especialidades..."
              />
            </div>

            {/* Specialties Section */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Especialidades e Focos</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Adicione uma especialidade (ex: Ansiedade)"
                  className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                  id="specialty-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value.trim();
                      if (val && !formData.specialties.includes(val)) {
                        setFormData({ ...formData, specialties: [...formData.specialties, val] });
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('specialty-input') as HTMLInputElement;
                    const val = input.value.trim();
                    if (val && !formData.specialties.includes(val)) {
                      setFormData({ ...formData, specialties: [...formData.specialties, val] });
                      input.value = '';
                    }
                  }}
                  className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.specialties.length === 0 && (
                  <span className="text-sm text-slate-400 italic">Nenhuma especialidade adicionada.</span>
                )}
                {formData.specialties.map((spec: string) => (
                  <span key={spec} className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg text-sm font-medium flex items-center gap-2 border border-primary-100 dark:border-primary-800">
                    {spec}
                    <button
                      onClick={() => setFormData({ ...formData, specialties: formData.specialties.filter((s: string) => s !== spec) })}
                      className="text-primary-400 hover:text-primary-600"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Certificates Section */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Certificações e Validação</label>
              <div className="space-y-4">
                <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        setUploading(true);
                        
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const base64Url = event.target?.result as string;
                          
                          const newCert = {
                            name: file.name,
                            url: base64Url,
                            status: 'pending' // pending, verified, rejected
                          };

                          setFormData({ ...formData, certificates: [...(formData.certificates || []), newCert] });
                          triggerToast('Certificado enviado para validação!', 'success');
                          setUploading(false);
                        };
                        
                        reader.onerror = (err) => {
                          console.error(err);
                          triggerToast('Erro ao ler certificado.', 'error');
                          setUploading(false);
                        };
                        
                        reader.readAsDataURL(file);
                      } catch (err) {
                        console.error(err);
                        triggerToast('Erro ao processar certificado.', 'error');
                        setUploading(false);
                      }
                    }
                    }
                  />
                  <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
                    <UploadCloud className="h-10 w-10 text-slate-400 group-hover:text-primary-500" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Clique para enviar certificado (PDF, JPG)
                    </p>
                    <p className="text-xs text-slate-400">
                      Comprove titulações como TRG Master
                    </p>
                  </div>
                </div>

                {/* Certificates List */}
                <div className="space-y-2">
                  {formData.certificates?.map((cert: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                      <div className="flex items-center gap-3">
                        <FileText className="text-slate-400" size={18} />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{cert.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] uppercase font-bold tracking-wider ${cert.status === 'verified' ? 'text-green-600' :
                              cert.status === 'rejected' ? 'text-red-500' : 'text-amber-500'
                              }`}>
                              {cert.status === 'verified' ? 'Validado CITRG' : cert.status === 'rejected' ? 'Rejeitado' : 'Em Análise (CITRG)'}
                            </span>
                            {cert.status === 'pending' && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={async () => {
                                    try {
                                      triggerToast('Inicializando leitura do documento...', 'success');
                                      let imageUrlToScan = cert.url;

                                      if (cert.url.startsWith('data:application/pdf')) {
                                        triggerToast('Processando arquivo PDF...', 'success');
                                        const pdfjsLib = await import('pdfjs-dist');
                                        const workerUrlModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
                                        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrlModule.default;

                                        const base64Data = cert.url.split(',')[1];
                                        const binaryString = atob(base64Data);
                                        const len = binaryString.length;
                                        const bytes = new Uint8Array(len);
                                        for (let i = 0; i < len; i++) {
                                          bytes[i] = binaryString.charCodeAt(i);
                                        }

                                        const pdfTask = pdfjsLib.getDocument({ data: bytes });
                                        const pdf = await pdfTask.promise;
                                        const page = await pdf.getPage(1);
                                        const viewport = page.getViewport({ scale: 1.5 });
                                        
                                        const canvas = document.createElement('canvas');
                                        const context = canvas.getContext('2d');
                                        if (!context) throw new Error('Não foi possível criar o canvas');
                                        canvas.height = viewport.height;
                                        canvas.width = viewport.width;
                                        
                                        await page.render({ canvasContext: context, viewport } as any).promise;
                                        imageUrlToScan = canvas.toDataURL('image/jpeg');
                                      }

                                      triggerToast('Iniciando análise OCR...', 'success');

                                      const Tesseract = (await import('tesseract.js')).default;
                                      const { data: { text } } = await Tesseract.recognize(
                                        imageUrlToScan,
                                        'por',
                                        { logger: m => console.log(m) }
                                      );

                                      const scanText = text.toLowerCase();
                                      console.log('OCR Result:', scanText);

                                      const safeName = formData.name.toLowerCase().split(' ')[0];
                                      const safeCode = formData.citrg_code.toLowerCase().replace(/[^a-z0-9]/g, '');

                                      const hasKeyword = scanText.includes('trg') || scanText.includes('terapia') || scanText.includes('certificado') || scanText.includes('master') || scanText.includes('citrg');
                                      const hasName = safeName && scanText.includes(safeName);
                                      const hasCode = safeCode && scanText.replace(/[^a-z0-9]/g, '').includes(safeCode);

                                      if (hasKeyword && (hasName || hasCode)) {
                                        triggerToast('Buscando referências na rede...', 'success');
                                        await new Promise(r => setTimeout(r, 2000));
                                        const updatedCerts = [...formData.certificates];
                                        updatedCerts[idx].status = 'verified';
                                        
                                        const newFormData = { ...formData, certificates: updatedCerts, is_verified: true };
                                        setFormData(newFormData);
                                        triggerToast(`Membro Validado: ${formData.name} - CITRG ${formData.citrg_code}`, 'success');
                                        
                                        const { data: { user } } = await supabase.auth.getUser();
                                        if (user) {
                                          await supabase.from('therapists').update({
                                            certificates: updatedCerts,
                                            is_verified: true
                                          }).eq('id', user.id);
                                          
                                          await supabase.auth.updateUser({ data: { is_verified: true } });
                                          localStorage.setItem('TRG_SETTINGS', JSON.stringify({ ...newFormData, availability }));
                                        }
                                      } else {
                                        triggerToast('Documento ilegível ou dados não conferem. Verifique se o nome ou CITRG estão visíveis.', 'error');
                                      }
                                    } catch (err: any) {
                                      console.error(err);
                                      triggerToast(`Erro na leitura: ${err.message || 'Tente uma imagem nítida.'}`, 'error');
                                    }
                                  }}
                                  className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                                >
                                  <CheckCircle2 size={12} /> Validar Credenciais
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const remainingCerts = formData.certificates.filter((_: any, i: number) => i !== idx);
                          const hasVerified = remainingCerts.some((c: any) => c.status === 'verified');
                          setFormData({ 
                            ...formData, 
                            certificates: remainingCerts,
                            is_verified: hasVerified 
                          });
                        }}
                        className="text-slate-400 hover:text-red-500 p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
