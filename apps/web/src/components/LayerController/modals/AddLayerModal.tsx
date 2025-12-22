import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AddLayerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddLayerModal = ({ isOpen, onOpenChange }: AddLayerModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add a layer</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground pt-2">
            Add a layer to your map, either from a web based source, or uploaded from your computer. These layers are only added for the duration of your session.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="flex flex-col items-center justify-center p-6 border rounded-xl hover:bg-muted/50 cursor-pointer transition-colors group">
            <span className="material-symbols-outlined text-4xl text-blue-600 mb-3">public</span>
            <span className="text-blue-600 font-medium text-lg">Add a web layer</span>
          </div>
          <div className="flex flex-col items-center justify-center p-6 border rounded-xl hover:bg-muted/50 cursor-pointer transition-colors group">
            <span className="material-symbols-outlined text-4xl text-blue-600 mb-3">cloud_upload</span>
            <span className="text-blue-600 font-medium text-lg">Upload data</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
