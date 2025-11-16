import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import pixQRCode from "@/assets/pix-qrcode.png";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpgradeDialog = ({ open, onOpenChange }: UpgradeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl">Olá, seu acesso gratuito terminou! 😔</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 text-base">
              <p>
                Mas calma, se você é aluno:{" "}
                <strong>Formação Lendária, Founders ou Gestor[IA]</strong> chame o{" "}
                <strong>Charão no WhatsApp</strong> que ele liberará o acesso pra você! 😊
              </p>
              
              <p>
                Agora se você ainda não é aluno Lendário, você pode ter acesso livre à
                plataforma, assinando com preço promocional de lançamento.
              </p>
              
              <div className="bg-primary/10 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-primary mb-2">R$ 17,90/mês</p>
              </div>
              
              <p className="text-sm">
                Basta clicar no QR Code abaixo e fazer o pix. Envie o comprovante para o
                e-mail{" "}
                <a
                  href="mailto:lucascharao@iaxlab.top"
                  className="text-primary font-semibold hover:underline"
                >
                  lucascharao@iaxlab.top
                </a>{" "}
                que receberá seu acesso em até 8hs.
              </p>
              
              <div className="flex flex-col items-center gap-4 py-4">
                <img
                  src={pixQRCode}
                  alt="QR Code PIX"
                  className="w-64 h-64 rounded-lg border-2 border-border"
                />
                
                <div className="w-full">
                  <p className="text-sm font-semibold mb-2">Ou use a chave copia e cola:</p>
                  <div className="bg-muted p-3 rounded text-xs break-all font-mono">
                    00020101021126360014br.gov.bcb.pix011456890850000167520400005303986540517.905802BR5925IAX
                    LAB INOVA SIMPLES (I.6009SAO PAULO622905251KA4Z2VQZVZV76323K1RC79HT6304C544
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
