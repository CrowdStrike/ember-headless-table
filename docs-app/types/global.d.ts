declare module '*.css' {
  const styles: { [className: string]: string };
  export default styles;
}

// Types for these are not yet shipped
declare module '@ember/helper';
declare module '@ember/modifier';

// Types for these do not exist
declare module 'highlightjs-glimmer/vendor/highlight.js';
declare module 'highlightjs-glimmer/vendor/javascript.min';
