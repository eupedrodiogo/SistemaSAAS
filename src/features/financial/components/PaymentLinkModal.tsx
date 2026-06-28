import React from 'react';
import { X, Globe, CheckCircle2, Copy, Link as LinkIcon } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// We assume CheckoutForm will be passed as children or imported
interface PaymentLinkModalProps {
  setIsPaymentLinkModalOpen: (open: boolean) => void;
  paymentLinkData: any;
  setPaymentLinkData: React.Dispatch<React.SetStateAction<any>>;
  generateLink: () => void;
  copyToClipboard: () => void;
  stripePromise: Promise<Stripe | null>;
  children: React.ReactNode;
}

export const PaymentLinkModal: React.FC<PaymentLinkModalProps> = ({
  setIsPaymentLinkModalOpen,
  paymentLinkData,
  setPaymentLinkData,
  generateLink,
  copyToClipboard,
  stripePromise,
  children
}) => {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && setIsPaymentLinkModalOpen(false)}>
      <DialogContent className="p-0 overflow-hidden sm:max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col gap-0 [&>button]:text-white/70 hover:[&>button]:text-white [&>button]:top-4 [&>button]:right-4">
        <DialogTitle className="sr-only">Gerar Link de Checkout</DialogTitle>
        <DialogDescription className="sr-only">Crie um link de pagamento Stripe.</DialogDescription>
        
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-[#635BFF] flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Globe size={20} />
            <h3 className="font-bold">Gerar Link de Checkout</h3>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Título do Serviço</label>
            <Input
              type="text"
              className="h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
              value={paymentLinkData.title}
              onChange={(e) => setPaymentLinkData({ ...paymentLinkData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Valor (BRL)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
              <Input
                type="number"
                className="h-12 pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                value={paymentLinkData.price}
                onChange={(e) => setPaymentLinkData({ ...paymentLinkData, price: e.target.value })}
              />
            </div>
          </div>

          {paymentLinkData.generatedLink ? (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl animate-fade-in">
              <p className="text-xs text-green-700 dark:text-green-400 font-bold mb-2 uppercase flex items-center gap-1">
                <CheckCircle2 size={12} /> Link Gerado com Sucesso
              </p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={paymentLinkData.generatedLink}
                  className="flex-1 h-9 text-xs bg-white dark:bg-slate-800 border-green-200 dark:border-green-800 text-slate-600 dark:text-slate-300"
                />
                <Button onClick={copyToClipboard} size="icon" className="h-9 w-9 bg-green-600 text-white hover:bg-green-700">
                  <Copy size={16} />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={generateLink}
              className="w-full h-12 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 mt-2 flex justify-center gap-2"
            >
              <LinkIcon size={18} /> Criar Link
            </Button>
          )}
        </div>

        {paymentLinkData.clientSecret && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-slate-800 dark:text-white mb-4">Pagamento Seguro</h4>
            <Elements stripe={stripePromise} options={{ clientSecret: paymentLinkData.clientSecret, locale: 'pt-BR' }}>
              {children}
            </Elements>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
