/**
 * Base email template component and styles
 */

export interface BaseEmailProps {
  preview?: string;
  children: unknown;
}

export function BaseEmail(_props: BaseEmailProps): string {
  return '';
}

export const textStyles = {
  fontFamily: 'Arial, sans-serif',
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#333333',
};

export const buttonStyles = {
  display: 'inline-block',
  padding: '12px 24px',
  backgroundColor: '#007bff',
  color: '#ffffff',
  textDecoration: 'none',
  borderRadius: '4px',
  fontWeight: 'bold',
};
