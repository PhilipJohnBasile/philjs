
# Bioinformatics (`@philjs/bio`)

Decode life in the browser.

## DNA Tools
- **Semantics**: Translate codons to amino acids.
- **CRISPR**: `findCrisprTarget` locates PAM sequences for gene editing.

```typescript
import { DNA } from '@philjs/bio';
const targets = DNA.findCrisprTarget('GATTACA');
```
