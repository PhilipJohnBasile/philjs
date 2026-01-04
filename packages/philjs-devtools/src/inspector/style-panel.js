/**
 * Style Panel - Display and edit element styles
 */
export class StylePanel {
    container = null;
    currentNode = null;
    constructor(container) {
        this.container = container;
    }
    setNode(node) {
        this.currentNode = node;
        this.render();
    }
    render() {
        if (!this.container || !this.currentNode?.element) {
            if (this.container) {
                this.container.innerHTML = `
          <div style="padding: 16px; text-align: center; color: #888;">
            No element selected
          </div>
        `;
            }
            return;
        }
        const element = this.currentNode.element;
        const computedStyles = window.getComputedStyle(element);
        const inlineStyles = element.style;
        let html = '<div style="padding: 8px;">';
        // Box Model Visualization
        html += this.renderBoxModel(element, computedStyles);
        // Inline Styles
        if (inlineStyles.length > 0) {
            html += `
        <div style="margin-top: 16px;">
          <div style="font-weight: 600; margin-bottom: 8px; color: #f59e0b;">Inline Styles</div>
          ${this.renderInlineStyles(inlineStyles)}
        </div>
      `;
        }
        // Computed Styles (categorized)
        html += `
      <div style="margin-top: 16px;">
        <div style="font-weight: 600; margin-bottom: 8px; color: #3b82f6;">Computed Styles</div>
        ${this.renderComputedStyles(computedStyles)}
      </div>
    `;
        html += '</div>';
        this.container.innerHTML = html;
        // Attach style category toggle handlers
        this.container.querySelectorAll('.style-category-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const target = e.target;
                const category = target.closest('.style-category');
                const content = category?.querySelector('.style-category-content');
                if (content) {
                    const isHidden = content.style.display === 'none';
                    content.style.display = isHidden ? 'block' : 'none';
                    const arrow = target.querySelector('.toggle-arrow');
                    if (arrow)
                        arrow.textContent = isHidden ? '▼' : '▶';
                }
            });
        });
    }
    renderBoxModel(element, styles) {
        const margin = {
            top: parseFloat(styles.marginTop),
            right: parseFloat(styles.marginRight),
            bottom: parseFloat(styles.marginBottom),
            left: parseFloat(styles.marginLeft)
        };
        const border = {
            top: parseFloat(styles.borderTopWidth),
            right: parseFloat(styles.borderRightWidth),
            bottom: parseFloat(styles.borderBottomWidth),
            left: parseFloat(styles.borderLeftWidth)
        };
        const padding = {
            top: parseFloat(styles.paddingTop),
            right: parseFloat(styles.paddingRight),
            bottom: parseFloat(styles.paddingBottom),
            left: parseFloat(styles.paddingLeft)
        };
        const rect = element.getBoundingClientRect();
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        return `
      <div style="background: #2d2d2d; border-radius: 4px; padding: 12px;">
        <div style="text-align: center; font-size: 11px; color: #888; margin-bottom: 4px;">margin</div>
        <div style="position: relative; background: #f59e0b33; padding: 8px;">
          <div style="text-align: center; color: #f59e0b; font-size: 10px;">${margin.top}</div>
          <div style="display: flex; align-items: center;">
            <div style="width: 30px; text-align: center; color: #f59e0b; font-size: 10px;">${margin.left}</div>
            <div style="flex: 1; background: #3b82f633; padding: 8px;">
              <div style="text-align: center; color: #3b82f6; font-size: 10px; margin-bottom: 2px;">border</div>
              <div style="background: #10b98133; padding: 8px;">
                <div style="text-align: center; color: #10b981; font-size: 10px;">padding</div>
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span style="color: #10b981; font-size: 10px;">${padding.left}</span>
                  <div style="background: #8b5cf633; padding: 8px; text-align: center;">
                    <div style="color: #8b5cf6; font-size: 11px; font-weight: 500;">${width} × ${height}</div>
                  </div>
                  <span style="color: #10b981; font-size: 10px;">${padding.right}</span>
                </div>
                <div style="text-align: center; color: #10b981; font-size: 10px;">${padding.bottom}</div>
              </div>
            </div>
            <div style="width: 30px; text-align: center; color: #f59e0b; font-size: 10px;">${margin.right}</div>
          </div>
          <div style="text-align: center; color: #f59e0b; font-size: 10px;">${margin.bottom}</div>
        </div>
      </div>
    `;
    }
    renderInlineStyles(styles) {
        const entries = [];
        for (let i = 0; i < styles.length; i++) {
            const property = styles[i];
            if (!property)
                continue;
            const value = styles.getPropertyValue(property);
            if (value) {
                entries.push({ property, value });
            }
        }
        if (entries.length === 0) {
            return '<div style="color: #666; font-size: 11px;">No inline styles</div>';
        }
        return entries.map(({ property, value }) => `
      <div style="padding: 4px 0; display: flex; gap: 8px; font-size: 11px;">
        <span style="color: #3b82f6;">${property}</span>
        <span style="color: #666;">:</span>
        <span style="color: #10b981; flex: 1; word-break: break-all;">${value}</span>
      </div>
    `).join('');
    }
    renderComputedStyles(styles) {
        const categories = {
            'Layout': ['display', 'position', 'top', 'right', 'bottom', 'left', 'z-index', 'float', 'clear', 'visibility', 'overflow'],
            'Flex': ['flex', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-content', 'align-self', 'order', 'flex-grow', 'flex-shrink', 'flex-basis', 'gap'],
            'Grid': ['grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row', 'grid-gap'],
            'Box Model': ['width', 'height', 'min-width', 'max-width', 'min-height', 'max-height', 'margin', 'padding', 'box-sizing'],
            'Typography': ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align', 'text-decoration', 'text-transform', 'white-space', 'word-break'],
            'Colors': ['color', 'background-color', 'background', 'border-color', 'opacity'],
            'Border': ['border', 'border-width', 'border-style', 'border-radius', 'outline'],
            'Effects': ['box-shadow', 'text-shadow', 'transform', 'filter', 'backdrop-filter'],
            'Transitions': ['transition', 'animation']
        };
        return Object.entries(categories).map(([category, properties]) => {
            const items = properties
                .filter(prop => {
                const value = styles.getPropertyValue(prop);
                return value && value !== 'none' && value !== 'normal' && value !== 'auto' && value !== '0px';
            })
                .map(prop => ({
                property: prop,
                value: styles.getPropertyValue(prop)
            }));
            if (items.length === 0)
                return '';
            return `
        <div class="style-category" style="margin-bottom: 8px;">
          <div class="style-category-toggle" style="cursor: pointer; padding: 4px 0; display: flex; align-items: center; gap: 6px; color: #888;">
            <span class="toggle-arrow" style="font-size: 10px;">▼</span>
            <span style="font-weight: 500;">${category}</span>
            <span style="font-size: 10px;">(${items.length})</span>
          </div>
          <div class="style-category-content" style="padding-left: 16px;">
            ${items.map(({ property, value }) => `
              <div style="padding: 2px 0; display: flex; gap: 8px; font-size: 11px; font-family: monospace;">
                <span style="color: #3b82f6; min-width: 140px;">${property}</span>
                <span style="color: #10b981; word-break: break-all;">${value}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
        }).join('');
    }
    getComputedBox(element) {
        const styles = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
            content: {
                width: rect.width,
                height: rect.height
            },
            padding: {
                top: parseFloat(styles.paddingTop),
                right: parseFloat(styles.paddingRight),
                bottom: parseFloat(styles.paddingBottom),
                left: parseFloat(styles.paddingLeft)
            },
            border: {
                top: parseFloat(styles.borderTopWidth),
                right: parseFloat(styles.borderRightWidth),
                bottom: parseFloat(styles.borderBottomWidth),
                left: parseFloat(styles.borderLeftWidth)
            },
            margin: {
                top: parseFloat(styles.marginTop),
                right: parseFloat(styles.marginRight),
                bottom: parseFloat(styles.marginBottom),
                left: parseFloat(styles.marginLeft)
            }
        };
    }
}
//# sourceMappingURL=style-panel.js.map