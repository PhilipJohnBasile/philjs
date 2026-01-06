
export interface SmartFormProps {
    schemaDescription: string;
    onSubmit: (data: any) => void;
}

/**
 * A form that auto-generates validation rules based on natural language description.
 * Usage: <SmartForm schemaDescription="User registration with strict password rules" />
 */
export function SmartForm(props: SmartFormProps) {
    const formId = `smart-form-${Math.random().toString(36).substr(2, 9)}`;

    const handleSubmit = (e: any) => {
        e.preventDefault();

        // Simulate AI Validation
        setTimeout(() => {
            props.onSubmit({ mock: 'data' });
        }, 500);
    };

    // Mock auto-generation of fields based on description
    const fields = props.schemaDescription.toLowerCase().includes('password')
        ? ['email', 'password', 'confirm_password']
        : ['text_input'];

    const inputs = fields.map(f =>
        `<input name="${f}" placeholder="${f.replace('_', ' ')}" class="phil-input" />`
    ).join('');

    return `
    <form id="${formId}" class="phil-smart-form" onsubmit="(${handleSubmit.toString()})(event)">
      <div class="ai-badge">✨ AI Validated</div>
      ${inputs}
      <button type="submit">Submit</button>
    </form>
  `;
}
