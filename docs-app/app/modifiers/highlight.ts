import highlightCodeBlocks from 'docs-app/utils/hljs';
import { modifier } from 'ember-modifier';

export default modifier(highlightCodeBlocks, { eager: false });
