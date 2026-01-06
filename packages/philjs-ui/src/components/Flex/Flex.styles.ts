/**
 * PhilJS UI - Flex Styles
 */

export const flexStyles = `
  .philjs-flex {
    --flex-gap: var(--philjs-flex-gap, 0);
    display: flex;
    gap: var(--flex-gap);
  }

  .philjs-flex--inline {
    display: inline-flex;
  }

  .philjs-flex--row { flex-direction: row; }
  .philjs-flex--row-reverse { flex-direction: row-reverse; }
  .philjs-flex--col { flex-direction: column; }
  .philjs-flex--col-reverse { flex-direction: column-reverse; }

  .philjs-flex--wrap { flex-wrap: wrap; }
  .philjs-flex--nowrap { flex-wrap: nowrap; }
  .philjs-flex--wrap-reverse { flex-wrap: wrap-reverse; }

  .philjs-flex--align-start { align-items: flex-start; }
  .philjs-flex--align-center { align-items: center; }
  .philjs-flex--align-end { align-items: flex-end; }
  .philjs-flex--align-stretch { align-items: stretch; }
  .philjs-flex--align-baseline { align-items: baseline; }

  .philjs-flex--justify-start { justify-content: flex-start; }
  .philjs-flex--justify-center { justify-content: center; }
  .philjs-flex--justify-end { justify-content: flex-end; }
  .philjs-flex--justify-between { justify-content: space-between; }
  .philjs-flex--justify-around { justify-content: space-around; }
  .philjs-flex--justify-evenly { justify-content: space-evenly; }
`;

export default flexStyles;
