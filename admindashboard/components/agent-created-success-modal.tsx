"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AgentCreatedSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  password: string;
  agentEmail: string;
}

export function AgentCreatedSuccessModal({
  isOpen,
  onClose,
  password,
  agentEmail,
}: AgentCreatedSuccessModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const { toast } = useToast();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsCopied(false);
      setCanClose(false);
    }
  }, [isOpen]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setIsCopied(true);
      setCanClose(true);

      toast({
        title: "Password Copied",
        description:
          "The temporary password has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy password. Please copy it manually.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    if (canClose) {
      onClose();
      toast({
        title: "Agent Created Successfully",
        description: `${agentEmail} has been added as an agent.`,
      });
    } else {
      toast({
        title: "Please Copy Password",
        description: "You must copy the password before closing this dialog.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Agent Created Successfully!
          </DialogTitle>
          <DialogDescription>
            <strong>{agentEmail}</strong> has been successfully created and
            added to the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Agent Details</span>
            </div>
            <div className="text-sm text-green-700">
              <p>
                <strong>Email:</strong> {agentEmail}
              </p>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Please copy the temporary password
              below and share it securely with the agent. This password will
              only be shown once.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Temporary Password:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Password
                  </>
                )}
              </Button>
            </div>

            <div className="p-3 bg-gray-50 border rounded-lg font-mono text-sm break-all select-all">
              {password}
            </div>
          </div>

          {isCopied && (
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Password copied successfully! You can now close this dialog and
                share the password with the agent.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleClose}
            disabled={!canClose}
            className={canClose ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {canClose ? "Done" : "Copy Password First"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
