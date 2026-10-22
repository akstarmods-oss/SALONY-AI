/**
 * ToolManager: Validates and executes tools requested by Salony
 * such as openWebsite, Torch simulation, WhatsApp, and YouTube.
 */

export interface ToolActionResult {
  type: 'openWebsite' | 'controlDeviceAction';
  success: boolean;
  message: string;
  url?: string;
  label?: string;
  action?: string;
}

export class ToolManager {
  private torchMediaStream: MediaStream | null = null;
  public isTorchOn = false;
  public onTorchChange: ((isOn: boolean) => void) | null = null;
  public onActionExecuted: ((result: ToolActionResult) => void) | null = null;

  /**
   * Safely opens a website URL after validating protocols.
   */
  async openWebsite(rawUrl: string, label?: string): Promise<ToolActionResult> {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        const errResult: ToolActionResult = {
          type: 'openWebsite',
          success: false,
          message: 'Only HTTP and HTTPS URLs are permitted.',
        };
        this.notify(errResult);
        return errResult;
      }

      // Safe URL
      const targetUrl = parsed.toString();
      const siteLabel = label || parsed.hostname;

      // Try window.open
      const newWin = window.open(targetUrl, '_blank', 'noopener,noreferrer');

      const result: ToolActionResult = {
        type: 'openWebsite',
        success: true,
        url: targetUrl,
        label: siteLabel,
        message: newWin
          ? `Opened ${siteLabel}`
          : `Popup opened for ${siteLabel} (tap button to launch)`,
      };

      this.notify(result);
      return result;
    } catch (e: any) {
      const errResult: ToolActionResult = {
        type: 'openWebsite',
        success: false,
        message: `Failed to open website: ${e?.message || 'Invalid URL'}`,
      };
      this.notify(errResult);
      return errResult;
    }
  }

  /**
   * Executes device actions like Torch, YouTube, or WhatsApp.
   */
  async executeDeviceAction(action: string, reason?: string): Promise<ToolActionResult> {
    switch (action) {
      case 'TORCH_ON': {
        await this.toggleTorch(true);
        const res: ToolActionResult = {
          type: 'controlDeviceAction',
          success: true,
          action: 'TORCH_ON',
          message: reason || 'Torch is now turned ON',
        };
        this.notify(res);
        return res;
      }

      case 'TORCH_OFF': {
        await this.toggleTorch(false);
        const res: ToolActionResult = {
          type: 'controlDeviceAction',
          success: true,
          action: 'TORCH_OFF',
          message: reason || 'Torch is now turned OFF',
        };
        this.notify(res);
        return res;
      }

      case 'OPEN_YOUTUBE': {
        return this.openWebsite('https://www.youtube.com', 'YouTube');
      }

      case 'OPEN_WHATSAPP': {
        return this.openWebsite('https://web.whatsapp.com', 'WhatsApp');
      }

      default: {
        const res: ToolActionResult = {
          type: 'controlDeviceAction',
          success: false,
          action,
          message: `Unknown device action: ${action}`,
        };
        this.notify(res);
        return res;
      }
    }
  }

  /**
   * Toggles the hardware camera flash (if available on mobile device)
   * and dispatches state for the screen flashlight overlay.
   */
  async toggleTorch(turnOn: boolean): Promise<boolean> {
    this.isTorchOn = turnOn;
    if (this.onTorchChange) {
      this.onTorchChange(this.isTorchOn);
    }

    if (turnOn) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          });
          this.torchMediaStream = stream;
          const track = stream.getVideoTracks()[0];
          const imageCapture = (track as any).getCapabilities?.();
          if (imageCapture && imageCapture.torch) {
            await (track as any).applyConstraints({
              advanced: [{ torch: true }],
            });
          }
        }
      } catch (err) {
        // Hardware camera torch not accessible (e.g. desktop or permission denied),
        // Screen-level torch overlay handles this automatically!
      }
      return true;
    } else {
      if (this.torchMediaStream) {
        this.torchMediaStream.getTracks().forEach((track) => track.stop());
        this.torchMediaStream = null;
      }
      return false;
    }
  }

  private notify(result: ToolActionResult): void {
    if (this.onActionExecuted) {
      this.onActionExecuted(result);
    }
  }
}

export const toolManager = new ToolManager();
