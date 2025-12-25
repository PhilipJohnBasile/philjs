/**
 * Element Highlighter - Visual overlay for highlighting DOM elements
 */

export interface HighlightOptions {
  color?: string;
  borderColor?: string;
  labelBackground?: string;
  showDimensions?: boolean;
  showMargin?: boolean;
  showPadding?: boolean;
}

const defaultOptions: HighlightOptions = {
  color: 'rgba(59, 130, 246, 0.2)',
  borderColor: '#3b82f6',
  labelBackground: '#3b82f6',
  showDimensions: true,
  showMargin: true,
  showPadding: true
};

export class ElementHighlighter {
  private overlay: HTMLElement | null = null;
  private marginOverlay: HTMLElement | null = null;
  private paddingOverlay: HTMLElement | null = null;
  private label: HTMLElement | null = null;
  private dimensionsLabel: HTMLElement | null = null;
  private options: HighlightOptions;
  private currentElement: HTMLElement | null = null;
  private animationFrame: number = 0;

  constructor(options: HighlightOptions = {}) {
    this.options = { ...defaultOptions, ...options };
    this.createOverlays();
  }

  private createOverlays(): void {
    if (typeof document === 'undefined') return;

    // Main content overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'philjs-highlighter-content';
    this.overlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 999997;
      background: ${this.options.color};
      border: 2px solid ${this.options.borderColor};
      opacity: 0;
      transition: opacity 0.1s ease;
    `;

    // Margin overlay
    this.marginOverlay = document.createElement('div');
    this.marginOverlay.id = 'philjs-highlighter-margin';
    this.marginOverlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 999996;
      background: rgba(249, 115, 22, 0.15);
      opacity: 0;
      transition: opacity 0.1s ease;
    `;

    // Padding overlay
    this.paddingOverlay = document.createElement('div');
    this.paddingOverlay.id = 'philjs-highlighter-padding';
    this.paddingOverlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 999998;
      background: rgba(16, 185, 129, 0.2);
      opacity: 0;
      transition: opacity 0.1s ease;
    `;

    // Component label
    this.label = document.createElement('div');
    this.label.id = 'philjs-highlighter-label';
    this.label.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 999999;
      background: ${this.options.labelBackground};
      color: white;
      padding: 2px 6px;
      font-size: 11px;
      font-family: system-ui, -apple-system, sans-serif;
      border-radius: 2px;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.1s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;

    // Dimensions label
    this.dimensionsLabel = document.createElement('div');
    this.dimensionsLabel.id = 'philjs-highlighter-dimensions';
    this.dimensionsLabel.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 999999;
      background: #374151;
      color: white;
      padding: 2px 6px;
      font-size: 10px;
      font-family: monospace;
      border-radius: 2px;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.1s ease;
    `;

    document.body.appendChild(this.marginOverlay);
    document.body.appendChild(this.paddingOverlay);
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.label);
    document.body.appendChild(this.dimensionsLabel);
  }

  public highlight(element: HTMLElement, label?: string): void {
    if (!this.overlay || !this.label) return;

    this.currentElement = element;
    this.updatePosition(label);
    this.startTracking();
  }

  private updatePosition(label?: string): void {
    if (!this.currentElement || !this.overlay) return;

    const element = this.currentElement;
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);

    // Parse box model values
    const margin = {
      top: parseFloat(styles.marginTop),
      right: parseFloat(styles.marginRight),
      bottom: parseFloat(styles.marginBottom),
      left: parseFloat(styles.marginLeft)
    };
    const padding = {
      top: parseFloat(styles.paddingTop),
      right: parseFloat(styles.paddingRight),
      bottom: parseFloat(styles.paddingBottom),
      left: parseFloat(styles.paddingLeft)
    };

    // Position main overlay (content box)
    this.overlay.style.left = `${rect.left}px`;
    this.overlay.style.top = `${rect.top}px`;
    this.overlay.style.width = `${rect.width}px`;
    this.overlay.style.height = `${rect.height}px`;
    this.overlay.style.opacity = '1';

    // Position margin overlay
    if (this.marginOverlay && this.options.showMargin) {
      this.marginOverlay.style.left = `${rect.left - margin.left}px`;
      this.marginOverlay.style.top = `${rect.top - margin.top}px`;
      this.marginOverlay.style.width = `${rect.width + margin.left + margin.right}px`;
      this.marginOverlay.style.height = `${rect.height + margin.top + margin.bottom}px`;
      this.marginOverlay.style.opacity = '1';
    }

    // Position padding overlay (inside the element)
    if (this.paddingOverlay && this.options.showPadding) {
      // Show padding as the area between content and border
      this.paddingOverlay.style.left = `${rect.left + padding.left}px`;
      this.paddingOverlay.style.top = `${rect.top + padding.top}px`;
      this.paddingOverlay.style.width = `${rect.width - padding.left - padding.right}px`;
      this.paddingOverlay.style.height = `${rect.height - padding.top - padding.bottom}px`;
      this.paddingOverlay.style.opacity = '1';
    }

    // Position label
    if (this.label && label) {
      this.label.textContent = label;
      const labelTop = rect.top - 24;
      this.label.style.left = `${rect.left}px`;
      this.label.style.top = `${labelTop < 0 ? rect.bottom + 4 : labelTop}px`;
      this.label.style.opacity = '1';
    }

    // Position dimensions label
    if (this.dimensionsLabel && this.options.showDimensions) {
      this.dimensionsLabel.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
      this.dimensionsLabel.style.left = `${rect.right + 4}px`;
      this.dimensionsLabel.style.top = `${rect.top}px`;
      this.dimensionsLabel.style.opacity = '1';
    }
  }

  private startTracking(): void {
    // Track element position for scrolling and layout changes
    const track = () => {
      if (this.currentElement) {
        this.updatePosition(this.label?.textContent || undefined);
        this.animationFrame = requestAnimationFrame(track);
      }
    };
    this.animationFrame = requestAnimationFrame(track);
  }

  public hide(): void {
    cancelAnimationFrame(this.animationFrame);
    this.currentElement = null;

    if (this.overlay) this.overlay.style.opacity = '0';
    if (this.marginOverlay) this.marginOverlay.style.opacity = '0';
    if (this.paddingOverlay) this.paddingOverlay.style.opacity = '0';
    if (this.label) this.label.style.opacity = '0';
    if (this.dimensionsLabel) this.dimensionsLabel.style.opacity = '0';
  }

  public updateOptions(options: Partial<HighlightOptions>): void {
    this.options = { ...this.options, ...options };

    if (this.overlay) {
      this.overlay.style.background = this.options.color || '';
      this.overlay.style.borderColor = this.options.borderColor || '';
    }
    if (this.label) {
      this.label.style.background = this.options.labelBackground || '';
    }
  }

  public setColor(color: string, borderColor?: string): void {
    this.updateOptions({
      color: `${color}33`, // Add transparency
      borderColor: borderColor || color,
      labelBackground: borderColor || color
    });
  }

  public flash(element: HTMLElement, color: string = '#3b82f6'): void {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      pointer-events: none;
      background: ${color}44;
      border: 2px solid ${color};
      z-index: 999996;
      animation: philjs-highlight-flash 0.4s ease-out forwards;
    `;

    const rect = element.getBoundingClientRect();
    flash.style.left = `${rect.left}px`;
    flash.style.top = `${rect.top}px`;
    flash.style.width = `${rect.width}px`;
    flash.style.height = `${rect.height}px`;

    // Add keyframes if not already present
    if (!document.getElementById('philjs-highlight-styles')) {
      const style = document.createElement('style');
      style.id = 'philjs-highlight-styles';
      style.textContent = `
        @keyframes philjs-highlight-flash {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.05); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 400);
  }

  public destroy(): void {
    cancelAnimationFrame(this.animationFrame);
    this.overlay?.remove();
    this.marginOverlay?.remove();
    this.paddingOverlay?.remove();
    this.label?.remove();
    this.dimensionsLabel?.remove();
  }

  public isHighlighting(): boolean {
    return this.currentElement !== null;
  }

  public getCurrentElement(): HTMLElement | null {
    return this.currentElement;
  }
}
